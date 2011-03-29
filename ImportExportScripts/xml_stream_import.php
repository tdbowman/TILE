<?php
class XMLStreamImport extends CoreData
{	
	private $parser;
	private $milestone_xpath;
	private $image_xpath;
	private $line_start_xpath;
	private $line_end_xpath;
	private $document_start_xpath;
	private $text_stack;
	private $current_line;
	private $element_stack;
	private $attributes_stack;
	private $element_stack_depth;
	private $document_started = false;
	public  $break_lines_on_newline = false;
	
	public function __construct($content) {
		$this -> setup_parser();
		parent::__construct($content);
	}
	
	// This function parses the supplied XML $content based on the configured
	// XPaths.  See tei_p5_import for an example of how to configure XPaths.
	// This function is called by the CoreData object constructor after setup.
	public function parse_content($content) {
		$this -> element_stack = array();
		$this -> element_stack_depth = 0;
		$this -> text_stack = array("");
		$this -> current_line = "";
		$this -> attributes_stack = array();
		if($this -> document_start_xpath == "") {
			$this -> document_started = true;
		}
				
		xml_parse( $this -> parser, $content );
	}
	
	// Sets the XPath for Milestones, which divide the XML document into containers of lines.
	public function setMilestoneXPath($path) {
		// we want to parse it so we know what the element stack needs to look like
		// for now, we only support / and // for separators
		$this -> milestone_xpath = $this -> build_xpath_regex($path);
	}
	
	// Sets the XPath for Image URLs, which are attached to the current container
	// Each container only has one Image URL, so you may want to coordinate the XPaths
	// for Image URLs and Milestones.
	public function setImageURLXPath($path) {
		$this -> image_xpath = $this -> build_xpath_regex($path);
	}
	
	// Sets the XPath that denotes the beginning of a line within a container.  A container change will
	// save the contents of the line up to the new container in the prior container, and begin a new line.
	public function setLineStartXPath($path) {
		$this -> line_start_xpath = $this -> build_xpath_regex($path);
	}
	
	// Sets the XPath that denotes the end of a line within a container.  If not given, then the
	// start of a line will save the prior line text and begin a new line.
	public function setLineEndXPath($path) {
		$this -> line_end_xpath = $this -> build_xpath_regex($path);
	}
	
	public function setDocumentStartXPath($path) {
		$this -> document_start_xpath = $this -> build_xpath_regex($path);
	}
	
	// Converts the non-attribute portion of an XPath into a regular expression that
	// matches against the path that represents the element stack.
	// For example:
	//   //pb => array( '{^/.+/pb/$}', '' )
	//   /foo/bar => array( '{^/foo/bar/$}', '' )
	//   //pb/@facs => array( '{^/.+/pb/$}', 'facs' )
	//   /*/p => array( '{/[^/]+/p/$}', '' )
	public function build_xpath_regex($path) {
		$parts = explode('|', $path);
		$regex = "(";
		$attributes = array();
		foreach($parts as $part) {
			$foo = $this -> _build_xpath_regex($part);
			$regex .= $foo[0];
			if($foo[1]) {
				$attributes[$foo[0]] = $foo[1];
			}
			$regex .= '|';
		}
		$regex = substr($regex, 0, -1);
		$regex .= ")";
		return array( "{^$regex\$}", $attributes );
	}
	
	private function _build_xpath_regex($path) {
		$bits = explode('/@', $path, 2);
		$attribute = count($bits) > 1 ? $bits[1] : '';
		$bits = explode('/', $bits[0]);
				
		$regex = '';
		foreach($bits as $bit) {
			if($bit == '') {
				// we can skip any number of element names
				$regex = $regex . "/.+/";
			}
			else {
				if($bit == '*') {
					$regex = $regex . "/[^/]+/";
				}
				else {
				    $regex = $regex . "/$bit/";
				}
			}
		}
		$regex = preg_replace('{/+}', '/', $regex);
		$regex = preg_replace('{/(\.\+/)+}', '/.+/', $regex);
		return array($regex, $attribute);
	}
	
	// returns a simple XPath expression representing the current element stack
	public function current_xpath() {
		return "/" . implode("/", array_slice(
			$this -> element_stack,
			0,
			$this -> element_stack_depth
			)
		) . "/";
	}
	
	// returns true if the supplied regular expression info matches the current xpath
	// returns false if $regex is empty
	public function stack_matches_path_q($regex) {
		if($regex == '') {
			return false;
		}
		return preg_match($regex[0], $this -> current_xpath()) != 0;
	}
	
	// Internal function that sets up the XML SAX parser
	public function setup_parser() {
		$this -> parser = xml_parser_create();
		
		xml_parser_set_option($this -> parser, XML_OPTION_CASE_FOLDING, false);

		xml_set_element_handler(
			$this->parser,
			array(&$this, "start_tag"),
			array(&$this, "_end_tag")
			);
		xml_set_character_data_handler(
			$this->parser,
			array(&$this, "character_data")
			);
	}
	
	private function get_attribute($attributes, $regex) {
		foreach($regex[1] as $path => $attr) {
			if($this -> stack_matches_path_q(array("{^$path\$}"))) {
				if(array_key_exists($attr, $attributes)) {
					return $attributes[$attr];
				}
			}
		}
		return false;
	}
	
	public function push_element_stack($name, $attributes) {
		$this -> element_stack[$this -> element_stack_depth] = $name;
		$this -> attribute_stack[$this -> element_stack_depth] = $attributes;
		$this -> text_stack[$this -> element_stack_depth] = "";
		$this -> element_stack_depth += 1;
	}
	
	public function pop_element_stack() {
		if($this -> element_stack_depth > 1) {
  			$this -> text_stack[$this -> element_stack_depth - 2] .= $this -> text_stack[$this -> element_stack_depth-1];
		}
		$this -> element_stack_depth -= 1;
	}
	
	public function current_attributes() {
		return $this -> attribute_stack[$this -> element_stack_depth - 1];
	}
	
	public function start_tag($parser, $name, array $attributes) {
		$this -> push_element_stack($name, $attributes);

        if(!$this -> document_started) {
	        if($this -> stack_matches_path_q($this -> document_start_xpath)) {
		        $this -> document_started = true;
        	}
        }

		if($this -> stack_matches_path_q($this -> milestone_xpath)) {
			$this -> saveCurrentLine();
			$this -> newMilestone($name, $attributes);
		}
		if($this -> stack_matches_path_q($this -> image_xpath)) {
			$v = $this -> get_attribute($attributes, $this -> image_xpath);
			if($v !== false) {
				// we are using an attribute of the current element
				$this -> current_container -> image_url = $v;
			}
		}
		if($this -> stack_matches_path_q($this -> line_start_xpath)) {
			if($this -> line_end_xpath == '') {
				$this -> saveCurrentLine();
			}
			$this -> current_line = "";
		}
	}
	
	public function _end_tag($parser, $name) {
		$this -> end_tag($parser, $name, $this -> current_attributes());
	}
	
	public function end_tag($parser, $name, $attributes) {
		if($this -> stack_matches_path_q($this -> image_xpath)) {
			if($this -> image_xpath[1] == '') {
				// we are using the text content
				$this -> current_container -> image_url = $this -> text_stack[$this -> element_stack_depth];
			}
		}
		if($this -> stack_matches_path_q($this -> line_end_xpath)) {
			$this -> saveCurrentLine();
		}
		
		$this -> pop_element_stack();
	}
	
	public function character_data($parser, $data) {
		if($this -> document_started) {
		    $this -> text_stack[$this -> element_stack_depth-1] .= $data;
		    $this -> current_line .= $data;
		}
	}
	
	public function newMilestone($name, $attributes) {
		$this -> newContainer();
	}
	
	public function saveCurrentLine() {
		if($this -> document_started) {
			$line = trim($this -> current_line);
			if($this -> break_lines_on_newline) {
				$lines = explode("\n", $line);
				foreach($lines as $line) {
					$this -> current_container -> addLine(trim($line));
				}
			}
			else {
  			    $this -> current_container -> addLine($line);
            }
			$this -> current_line = "";
	    }
	}
}

?>