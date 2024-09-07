var is_hand_demo = false;
var is_meatball_demo = false;
var is_reefenge_demo = false;
var is_nosight_demo = false;
var is_duelzone_demo = false;
var is_gallery_demo = false;
var is_control_demo = false;
var is_qduel_demo = false;
function show_hand_demo(){
    if(!is_hand_demo){
        document.getElementById("hand-demo").style.display = "block";
        document.getElementById("hand-photo").style.display = "none";
    }
    else{
        document.getElementById("hand-demo").style.display = "none";
        document.getElementById("hand-photo").style.display = "block";
    }
    is_hand_demo=!is_hand_demo;
}
function show_meatball_demo(){
    if(!is_meatball_demo){
        document.getElementById("meatball-demo").style.display = "block";
        document.getElementById("meatball-photo").style.display = "none";
    }
    else{
        document.getElementById("meatball-demo").style.display = "none";
        document.getElementById("meatball-photo").style.display = "block";
    }
    is_meatball_demo=!is_meatball_demo;
}
function show_reefenge_demo(){
    if(!is_reefenge_demo){
        document.getElementById("reefenge-demo").style.display = "block";
        document.getElementById("reefenge-photo").style.display = "none";
    }
    else{
        document.getElementById("reefenge-demo").style.display = "none";
        document.getElementById("reefenge-photo").style.display = "block";
    }
    is_reefenge_demo=!is_reefenge_demo;
}
function show_nosight_demo(){
    if(!is_nosight_demo){
        document.getElementById("nosight-demo").style.display = "block";
        document.getElementById("nosight-photo").style.display = "none";
    }
    else{
        document.getElementById("nosight-demo").style.display = "none";
        document.getElementById("nosight-photo").style.display = "block";
    }
    is_nosight_demo=!is_nosight_demo;
}
function show_qduel_demo(){
    if(!is_qduel_demo){
        document.getElementById("qduel-demo").style.display = "block";
        document.getElementById("qduel-photo").style.display = "none";
    }
    else{
        document.getElementById("qduel-demo").style.display = "none";
        document.getElementById("qduel-photo").style.display = "block";
    }
    is_qduel_demo=!is_qduel_demo;
}
function show_duelzone_demo(){
    if(!is_duelzone_demo){
        document.getElementById("duelzone-demo").style.display = "block";
        document.getElementById("duelzone-photo").style.display = "none";
    }
    else{
        document.getElementById("duelzone-demo").style.display = "none";
        document.getElementById("duelzone-photo").style.display = "block";
    }
    is_duelzone_demo=!is_duelzone_demo;
}
function show_gallery_demo(){
    if(!is_gallery_demo){
        document.getElementById("gallery-demo").style.display = "block";
        document.getElementById("gallery-photo").style.display = "none";
    }
    else{
        document.getElementById("gallery-demo").style.display = "none";
        document.getElementById("gallery-photo").style.display = "block";
    }
    is_gallery_demo=!is_gallery_demo;
}
function show_control_demo(){
    if(!is_control_demo){
        document.getElementById("control-demo").style.display = "block";
        document.getElementById("control-photo").style.display = "none";
    }
    else{
        document.getElementById("control-demo").style.display = "none";
        document.getElementById("control-photo").style.display = "block";
    }
    is_control_demo=!is_control_demo;
}