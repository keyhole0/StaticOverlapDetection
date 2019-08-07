
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
        this.draw(points);
        let imagedata = this.ctx.getImageData(0, 0, this.width, this.height);
        this.ctx.clearRect(0, 0, this.width, this.height);
        for(let i=0; i<this.duplicateArray.length; ++i){
            if(imagedata.data[i*4+3] == 255){
                this.duplicateArray[i] += 1;
            }
        }
    }
    hitImageData(stars){
        let hitimage = this.ctx.getImageData(0, 0, this.width, this.height);
        for(let j = 0; j < this.duplicateArray.length; ++j){
            if(this.duplicateArray[j] >= 2){
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

    const startTime = Date.now();
    let objectNum = 1000;

    let canvas = new Canvas('cv');

    let stars = [];
    for(let i=0; i<objectNum; ++i){
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let r = Math.random() * 30 + 5;
        let a = Math.random() * 360;
        stars.push(new Star(x, y, r, a));
    }

    for(let i=0; i<stars.length; ++i){
        canvas.drawImageData(stars[i].points);
    }
    
    for(let i=0; i<stars.length; ++i){
        canvas.draw(stars[i].points);
    }
    
    canvas.hitImageData(stars);

    const endTime = Date.now();
    let resultp = document.getElementById('result');
    resultp.innerHTML = 'オブジェクト数：' + objectNum + '、時間：' + (endTime-startTime) + 'ミリ秒'
}

main();