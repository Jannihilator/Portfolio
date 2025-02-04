var cue = 1;
var scrollScale = window.innerHeight * 0.1
// document.querySelector("#hero").style.top = scrollScale * 5;
window.addEventListener('scroll',function(e){
    const scrolled = window.scrollY;


    if(scrolled<scrollScale){
        if(cue==2){
            cue--;
            const boxes = Array.from(document.querySelector("#word1").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${1.2-index*0.2}s`;
                box.classList.remove("animate");
                box.classList.add("hide");
            });
        }
    }
    if(scrolled> scrollScale && scrolled<scrollScale*2){
        if(cue==1){
            cue++;
            const boxes = Array.from(document.querySelector("#word1").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${index*0.2}s`;
                box.classList.add("animate");
                box.classList.remove("hide");
            });
        }if(cue==3){
            cue--;
            const boxes = Array.from(document.querySelector("#word2").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${1.2-index*0.2}s`;
                box.classList.remove("animate");
                box.classList.add("hide");
            });
        }
    }if(scrolled>scrollScale*2 && scrolled<scrollScale*3){
        if(cue==2){
            cue++;
            const boxes = Array.from(document.querySelector("#word2").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${index*0.2}s`;
                box.classList.add("animate");
                box.classList.remove("hide");
            });
        }if(cue==4){
            cue--;
            const boxes = Array.from(document.querySelector("#word3").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${1.2-index*0.2}s`;
                box.classList.remove("animate");
                box.classList.add("hide");
            });
        }
    }if(scrolled>scrollScale*3 && scrolled<scrollScale*4){
        if(cue==3){
            cue++;
            const boxes = Array.from(document.querySelector("#word3").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${index*0.2}s`;
                box.classList.add("animate");
                box.classList.remove("hide");
            });
        }if(cue==5){
            cue--;
            const boxes = Array.from(document.querySelector("#word4").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${1.2-index*0.2}s`;
                box.classList.remove("animate");
                box.classList.add("hide");
            });
        }
    }if(scrolled>scrollScale*4 && scrolled<scrollScale*5){
        if(cue==4){
            cue++;
            const boxes = Array.from(document.querySelector("#word4").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${index*0.2}s`;
                box.classList.add("animate");
                box.classList.remove("hide");
            });
        }if(cue==6){
            cue--;
            const boxes = Array.from(document.querySelector("#word5").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${1.2-index*0.2}s`;
                box.classList.remove("animate");
                box.classList.add("hide");
            });
        }
    }if(scrolled>scrollScale*5 && scrolled<scrollScale*6){
        if(cue==5){
            cue++;
            const boxes = Array.from(document.querySelector("#word5").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${index*0.2}s`;
                box.classList.add("animate");
                box.classList.remove("hide");
            });
        }if(cue==7){
            cue--;
            const boxes = Array.from(document.querySelector("#word6").children);
            boxes.forEach((box, index)=> {
                box.style.animationDelay = `${1.2-index*0.2}s`;
                box.classList.remove("animate");
                box.classList.add("hide");
            });
        }
    }if(scrolled>scrollScale*6 && cue==6){
        cue++;
        const boxes = Array.from(document.querySelector("#word6").children);
        boxes.forEach((box, index)=> {
            box.style.animationDelay = `${index*0.2}s`;
            box.classList.add("animate");
            box.classList.remove("hide");
        });
    }
    // if(scrollBefore > scrolled){
    //     console.log("ScrollUP");
    //     scrollBefore = scrolled;
    //     //Desired action
    // }else{
    //     scrollBefore = scrolled;
    //     console.log("ScrollDOWN");
    //     //Desired action
    // }

})
