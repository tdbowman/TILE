<?php 

include_once('../PHP/secureInput.php');
#turn off error reporting and display errors
error_reporting(0); 

 $uri = checkXML($_GET["uri"]); // uri of document
 

 $rname =checkXML($_GET["rname"]); // root nodeName 
 $rnum =  checkXML($_GET["rnum"]); // index of root Node in document e.g. 0 = first TEXT node
 $imgPath =  checkXML($_GET["ipath"]); // server path for images



class txtNode {
	public function __construct($txt,$context,$offset){
	
		$this->txt = $txt;
		$this->context = $context;
		$this->offset = $offset;	
	}
}
$xmlDoc = new DOMDocument;
$xmlDoc->validateOnParse = true;
$xmlDoc->load($uri);

$root = $xmlDoc->getElementsByTagName($rname)->item($rnum);
$offsets = array();
$milestones = array();
$txtStr = "";
function findTxtNode4Offset($offset,$txtArray,$totalOffset){
	$totes = count($txtArray);
	$i = intval(($offset/$totalOffset)*$totes);
	
	while (!(($txtArray[$i]->offset<=$offset)&&($txtArray[($i+1)]->offset>$offset))){
			if (($txtArray[$i]->offset)>$offset){
				$i--;
			}
		    else if ($txtarray[$i+1]->offset<$offset){
		    	$i++;
		    }
		
	}
	
	return $i;
	
}
function getTxts4Node($node,$off,$txtStr,$offsets,$context,$milestones){
	if ($node->childNodes->length>0){
		foreach ($node->childNodes as $index=>$item){
	$oldcontext = $context;
		$context .= ">".$item->nodeName."[".$index."]";
		//echo $item->nodeName." ".$off."<br/>";
	if ($item->nodeName=="#text"){
		//echo $item->nodeValue." ".strlen($item->nodeValue)."<br/>";
		$offsets[] = new txtNode($item->nodeValue,$context,$off);
		$off = $off + strlen($item->nodeValue);
		$txtStr .= $item->nodeValue;
	}
	else{
		
		
		$back = getTxts4Node($item,$off,$txtStr,$offsets,$context,$milestones);
		//$context = $oldcontext;
		$off = $back[0];
		$offsets = $back[1];
		$milestones = $back[2];
		$txtStr = $back[3];
	}
	$context=$oldcontext;
	}
	}

	else {
		 if(isset($node->nodeName)){
	 		if ($node&&$node->nodeName&&(is_null($milestones[$node->nodeName]))){
	 			$milestones[$node->nodeName]=array();	
	 		}
	 	
	 		$milestones[$node->nodeName][]=array($off,$context,$node->attributes);
		}
	}
	
	return array($off,$offsets,$milestones,$txtStr);
}

function attsToString($atts){
	$ret = "";
	foreach ($atts as $att){
		$name = preg_replace("/,/","\,",$att->name);
		$value = preg_replace("/,/","\,",$att->value);
		$ret .= $att->name.",".$att->value.",";
	}
	$ret = substr($ret,0,strlen($ret)-1);
	return $ret;
}

$data = getTxts4Node($root,0,"",$offsets,$root->nodeName,$milestones);
//print_r($data);
//Export JSON

//print_r($data[1][$xyz]);
$ptxt = $data[3];

$lbs = $data[2]["lb"];
$cpb = 0;
$pbs = $data[2]["pb"];
$lastlb =0;
//-----
$curLb =0;
$lastP = 0;
$pbs[]=array(strlen($ptxt),"",null);
$stack=array();
$JSON = "{\"sourceFile\": \"$uri\", \"pages\": [";

// Generate random ID for all objects - in this case, lines
$characters=array("A","B","C","D","E","F","G","H","J","K","L","M",
"N","P","Q","R","S","T","U","V","W","X","Y","Z","1","2","3","4","5","6","7","8","9");
// empty container for array keys
$keys=array();
# empty array of labels 
$labels=array();

# collate pb tags
/*
for ($i=0;$i<(count($pbs)-1);$i++){
	# register URL for this page
	$facID = substr($pbs[$i][2]->getNamedItem("facs")->value,1);
	# parse out the facsimile tag
	$fac = $imgPath.$xmlDoc->getElementById($facID)->getElementsByTagName("graphic")->item(0)->getAttribute("url");
	# put in stack if not already there
	if(is_null($stack[$fac])){
		$stack[$fac]=true;
	} else {
		# collate by removing duplicate page
		$pbs=array_splice($pbs,$i,(-$i));
	}
	
	

}
*/
for ($i=0;$i<(count($pbs)-1);$i++){
	$facID = substr($pbs[$i][2]->getNamedItem("facs")->value,1);
	array_push($labels,"{\"name\":\"".preg_replace('/\#/','',$facID)."\", \"id\":\"".$facID."\"}");
	$fac = $imgPath.$xmlDoc->getElementById($facID)->getElementsByTagName("graphic")->item(0)->getAttribute("url");
	$pageInfo = "\"xpath\": \"".$pbs[$i][1]."\", \"facs\": \"".$facID."\""; 
	$JSON .= "{\"id\":\"".$facID."\", \"url\": \"".$fac."\", \"info\": {".$pageInfo."}, \"lines\": [";
	
	//echo $i." ".$curLb."<br/>";
	
	while (($curLb<count($lbs))&&($lbs[$curLb][0]<$pbs[$i+1][0])){
	  	
	$startCon = $lbs[$curLb][1];
	if (($curLb+1)>count($lbs)){
		$linetxt = substr($ptxt,$lbs[$curLb][0]);
	}
	else if ($lbs[$curLb+1][0]>$pbs[$i+1][0]) {
		$len = $pbs[$i+1][0]-$lbs[$curLb][0];
		$linetxt = substr($ptxt,$lbs[$curLb][0],$len);
	}
	else {
		$len = $lbs[$curLb+1][0]-$lbs[$curLb][0];
		$linetxt = substr($ptxt,$lbs[$curLb][0],$len);
	}
	
	// check to make sure there are no escape characters or illegal JSON 
	// characters
	// check for: / and \n
	$cleantxt=preg_replace('/(\n|[^A-Za-z0-9])/','[A]',$linetxt,-1);
	$cleantxt=preg_replace('/\[A\]/',' ',$cleantxt,-1);
#	$cleantxt=preg_replace('/\n|\t|\r/','    NEWLINE   ',$cleantxt);
	# if(preg_match('/[A-Za-z0-9]/',$cleantxt)==0) continue;
	//$linetxt = substr($ptxt,$lastlb,$len);
	// RANDOM ID GENERATION
	// generate random array that's not yet in $keys
	$x=rand(0,10000);
	# echo "line_".$x.'<hr/>   '.$cleantxt."<br/>";
	if(count($keys)>0){
		while(in_array($x, $keys)){
			
			// if in array, go through this loop
			$x=rand(0,10000);
		}
	}
	
	// store in $keys
	$keys[]=$x;
	
	
	$JSON.='{"id":"line_'.$x.'", "text":"'.addslashes($cleantxt).'","info": "lb['.$curLb.']>'.$startCon.'"}';
	$lastlb = $lbs[$curLb][0];	
	$curLb=$curLb+1;	
	if (($curLb<count($lbs))&&($lbs[$curLb][0]<$pbs[$i+1][0])){
		$JSON.=",";
	
	
	}
	
	}
	
	$lastP = $pbs[$i][0];
	$JSON .="]},";
	
}
# ADD TEST LABELS - CAN BE DEACTIVATED
$finalLabels=", \"labels\":[";
foreach($labels as $lab){
	$finalLabels.=$lab.",";
}
$finalLabels=substr($finalLabels,0,(count($finalLabels)-2));
$finalLabels.="]";
//get rid of excessive spaces and last comma
$jlength=(strlen($JSON)-1);
$JSON=preg_replace("/\n/","",substr($JSON,0,$jlength)."]".$finalLabels."}");
echo $JSON;
?>