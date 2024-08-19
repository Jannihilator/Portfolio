var cue = 1;
// document.querySelector("#hero").style.top = window.innerHeight * 5;
window.addEventListener('scroll',function(e){
    const scrolled = window.scrollY;
    // console.log(scrolled);
    if(scrolled==0){
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
    if(scrolled>0 && scrolled<window.innerHeight*0.5){
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
    }if(scrolled>window.innerHeight*0.5 && scrolled<window.innerHeight*1){
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
    }if(scrolled>window.innerHeight*1.0 && scrolled<window.innerHeight*1.5){
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
    }if(scrolled>window.innerHeight*1.5 && scrolled<window.innerHeight*2.0){
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
    }if(scrolled>window.innerHeight*2.0 && scrolled<window.innerHeight*2.5){
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
    }if(scrolled>window.innerHeight*2.5 && cue==6){
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