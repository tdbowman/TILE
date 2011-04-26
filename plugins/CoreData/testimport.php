<?php
include_once('coredata.php');
include_once('xml_stream_import.php');
include_once('tei_p5_with_facsimile_import.php');

$txt='<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="butterflies1_wv.xsl"?><?oasis-schema href="imt_1_8.rng" type="application/xml"?><?oxygen RNGSchema="imt_1_8.rng" type="xml"?><TEI xmlns="http://www.tei-c.org/ns/1.0" version="5.0" xml:id="butterflies1"><teiHeader>  <fileDesc>    <titleStmt><title></title></titleStmt>          <publicationStmt>      <p></p></publicationStmt>    <sourceDesc>    <p>2053 x 3131</p></sourceDesc></fileDesc>  <encodingDesc><tagsDecl xml:id="imtAnnotationCategories"><rendition xml:id="butterflies1_reading"><label>Reading Text</label><code rend="rectangle" lang="text/css">color: #ff0000</code></rendition><rendition xml:id="butterflies1_revisions"><label>Authorial Revisions</label><code rend="rectangle" lang="text/css">color: #0000ff</code></rendition></tagsDecl><appInfo>     <application ident="ImageMarkupTool01" version="1.8.1.7" notAfter="2010-06-01T16:37:46">     <label>     Image Markup Tool</label><desc>     Tool for annotating images using TEI</desc><ref type="appURI" target="http://www.tapor.uvic.ca/~mholmes/image_markup/">     </ref><ptr target="#imtAnnotatedImage"></ptr><ptr target="#imtImageAnnotations"></ptr><ptr target="#imtAnnotationCategories"></ptr></application>               </appInfo></encodingDesc></teiHeader><facsimile xml:id="imtAnnotatedImage"><surface><graphic url="http://localhost:8888/tile/images/butterflies.jpg" width="2053px" height="3131px"></graphic><zone xml:id="imtArea_0" rendition="butterflies1_reading" ulx="92" uly="411" lrx="1757" lry="1948" rend="visible"></zone><zone xml:id="imtArea_1" rendition="butterflies1_reading" ulx="58" uly="1969" lrx="1311" lry="2915" rend="visible"></zone><zone xml:id="imtArea_2" rendition="butterflies1_revisions" ulx="886" uly="424" lrx="1413" lry="672" rend="visible"></zone><zone xml:id="imtArea_3" rendition="butterflies1_revisions" ulx="308" uly="644" lrx="761" lry="798" rend="visible"></zone><zone xml:id="imtArea_4" rendition="butterflies1_revisions" ulx="294" uly="1232" lrx="467" lry="1325" rend="visible"></zone><zone xml:id="imtArea_6" rendition="butterflies1_revisions" ulx="284" uly="1540" lrx="1236" lry="1671" rend="visible"></zone><zone xml:id="imtArea__8" rendition="butterflies1_revisions" ulx="154" uly="1768" lrx="499" lry="1927" rend="visible"></zone><zone xml:id="imtArea_7" rendition="butterflies1_revisions" ulx="821" uly="2090" lrx="933" lry="2221" rend="visible"></zone><zone xml:id="imtArea_8" rendition="butterflies1_revisions" ulx="151" uly="2222" lrx="295" lry="2316" rend="visible"></zone><zone xml:id="imtArea_9" rendition="butterflies1_revisions" ulx="65" uly="2316" lrx="425" lry="2468" rend="visible"></zone><zone xml:id="imtArea_10" rendition="butterflies1_revisions" ulx="179" uly="2633" lrx="1095" lry="2835" rend="visible"></zone></surface></facsimile><text><body><div xml:id="imtImageAnnotations"><div corresp="#imtArea_0" type="imtAnnotation"><head>Stanza 1</head><div><p>01    Those butterflies enact it:</p><p>02    the ones that gather</p><p>03    on a dried stick:</p><p>04    small green unopened bud shapes</p><p>05    settle on the tip</p><p>06    below</p><p>07    those slightly larger</p><p>08    darkly pinker</p><p>09    &amp; lower</p><p>10    swarms</p><p>11    a blown — white-petalled cluster</p><p>12    which forms a loose brightly shaking blossom</p></div></div><div corresp="#imtArea_1" type="imtAnnotation"><head>Stanza 2</head><div><p>13    Frighten them &amp; they fly</p><p>14    green-winged, pink</p><p>15    in a flurry of snow</p><p>16    from a black stick</p><p>17    to settle again</p><p>18    exactly as before:</p><p>19    in a composite flower head</p></div></div><div corresp="#imtArea_2" type="imtAnnotation"><head>Line 1</head><div><p>01(1)    Those butterflies &lt;act it out&gt;:</p><p>01(2)    Those butterflies [enact it]:</p></div></div><div corresp="#imtArea_3" type="imtAnnotation"><head>Line 2</head><div><p>02(1)    the ones &lt;who&gt; gather</p><p>02(2)    the ones [that] gather</p></div></div><div corresp="#imtArea_4" type="imtAnnotation"><head>Line 7</head><div><p>07(1)    &lt;the&gt; slightly larger</p><p>07(2)    [those] slightly larger</p></div></div><div corresp="#imtArea_6" type="imtAnnotation"><head>Line 10</head><div><p>10(1)    &lt;the whole swarm almost&gt;</p><p>10(2)    [swarms]</p></div></div><div corresp="#imtArea__8" type="imtAnnotation"><head>Line 12</head><div><p>12(1)    &lt;in&gt; a loose brightly shaking blossom</p><p>12(2)    [which forms] a loose brightly shaking blossom</p></div></div><div corresp="#imtArea_7" type="imtAnnotation"><head>Line 14</head><div><p>14(1)    green-winged &lt;&amp;&gt; pink</p><p>14(2)    green-winged[,] pink</p></div></div><div corresp="#imtArea_8" type="imtAnnotation"><head>Line 15</head><div><p>15(1)    &lt;&gt;a flurry of snow</p><p>15(2)    [in] flurry of snow</p></div></div><div corresp="#imtArea_9" type="imtAnnotation"><head>Line 16</head><div><p>16(1)    &lt;near&gt; a &lt;dry&gt; stick</p><p>16(2)    [from] a &lt;[back]&gt; stick[incomplete]</p><p>16(3)    from a [black] stick</p></div></div><div corresp="#imtArea_10" type="imtAnnotation"><head>Line 19</head><div><p>19(1)    &lt;tight little green buds&gt;</p><p>20(1)    &lt;swelling pink&gt;</p><p>18/19(2) []</p></div></div></div></body></text></TEI>';

$parser=new TEIP5WithFacsimileImport($txt);

$data=$parser->to_json();
header('Content-type: text/html');
echo '<textarea>'.$data.'</textarea>';



?>