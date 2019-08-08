
class Vector{
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

class Star{
    constructor(x, y, r, ang){
        this.center = new Vector(x,y);
        this.points = [];
        let rscale = [1, 0.4];
        let rcnt = 0;
        for(let i=0; i<360; i+=36){
            let angleRad = Math.PI*2*(i+ang)/360;
            let starr = r * rscale[rcnt%2];
            let px = starr * Math.cos(angleRad) + this.center.x;
            let py = starr * Math.sin(angleRad) + this.center.y;
            this.points.push(new Vector(px, py));
            rcnt += 1;
        }
        this.imagedata = null;
    }
    setImageData(imagedata){
        this.imagedata = imagedata;
    }
}

class Canvas{
    constructor(id){
        this.cvs = document.getElementById(id);
        this.ctx = this.cvs.getContext("2d");
        this.width = this.cvs.width;
        this.height = this.cvs.height;
        this.duplicateArray = Array(this.width * this.height);
        this.duplicateArray.fill(0);
        this.duplicateImage = null;
    }
    
    draw(points){
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for(let i=0; i<points.length; ++i){
            this.ctx.lineTo(points[i].x, points[i].y); // 3.指定座標まで線を引く
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    drawImageData(points){
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = 'rgba(100, 0, 0, 1)';
        this.draw(points);
    }
    saveHitImageData(){
        this.duplicateImage = this.ctx.getImageData(0, 0, this.width, this.height);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.restore();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        console.log(this.duplicateImage.data[0]);
        console.log(this.duplicateImage.data[1]);
        console.log(this.duplicateImage.data[2]);
        console.log(this.duplicateImage.data[3]);
    }
    hitImageData(stars){
        let hitimage = this.ctx.getImageData(0, 0, this.width, this.height);
        for(let j = 0; j < this.width*this.height; ++j){
            if(this.duplicateImage.data[j*4+0] >= 150){
                hitimage.data[j*4+0] = 255;
                hitimage.data[j*4+1] = 0;
                hitimage.data[j*4+2] = 0;
                hitimage.data[j*4+3] = 255;
            }
        }
        this.ctx.putImageData(hitimage, 0, 0);
    }
}

function main(){

    const startTime = performance.now();
    let objectNum = 500;

    let canvas = new Canvas('cv');

    let stars = [];
    for(let i=0; i<objectNum; ++i){
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let r = Math.random() * 20 + 5;
        let a = Math.random() * 360;
        stars.push(new Star(x, y, r, a));
    }
    //stars.push(new Star(0, 0, 100, -90));
    //stars.push(new Star(0, 0, 100, -90));

    for(let i=0; i<stars.length; ++i){
        canvas.drawImageData(stars[i].points);
    }

    canvas.saveHitImageData();
    
    for(let i=0; i<stars.length; ++i){
        canvas.draw(stars[i].points);
    }
    
    canvas.hitImageData(stars);

    const endTime = performance.now();
    let performanceTime = Math.round((endTime - startTime)*1000)/1000
    let resultp = document.getElementById('result');
    resultp.innerHTML = 'オブジェクト数：' + objectNum + '、時間：' + performanceTime + 'ミリ秒'
}

main();