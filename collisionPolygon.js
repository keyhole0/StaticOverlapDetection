
class Vector{
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    sub(vec){
        return new Vector(this.x - vec.x, this.y - vec.y);
    }
    angle(){
        return Math.atan2(this.y, this.x);
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
        this.isHit = false;
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
    
    draw(points, isHit){
        this.ctx.beginPath();
        if(isHit){
            this.ctx.fillStyle = 'rgba(192, 80, 77, 0.5)';
        }else{
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        }
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

//線分同士の交差判定
function clossLine(ax, ay, bx, by, cx, cy, dx, dy){
    var ta = (cx - dx) * (ay - cy) + (cy - dy) * (cx - ax);
    var tb = (cx - dx) * (by - cy) + (cy - dy) * (cx - bx);
    var tc = (ax - bx) * (cy - ay) + (ay - by) * (ax - cx);
    var td = (ax - bx) * (dy - ay) + (ay - by) * (ax - dx);

    //return tc * td < 0 && ta * tb < 0;
    return tc * td <= 0 && ta * tb <= 0; // 端点を含む場合
    //trueが返る場合は2つの線分が交差している。
    //falseが返る場合は2つの線分が交差していない。
}

//点の内判定
function pointInPolygon(point, polygon){
    let extend = new Vector(point.x, 10000); //y軸方向に伸ばす（値は判定に影響の無い範囲で適当に決める）
    let cnt = 0;
    for(let i=0; i<polygon.length; ++i){
        let vs1 = polygon[i];
        let ve1 = polygon[(i+1)%polygon.length];
        if(clossLine(vs1.x, vs1.y, ve1.x, ve1.y, point.x, point.y, extend.x, extend.y)){
            cnt += 1;
        }
    }
    //ポリゴンの頂点と交差しているとき、２つの辺と交差している扱いとなってしまっているため、正しく判定できていない。
    //点から一方向に伸ばした線分とポリゴンが交差している数が奇数ならポリゴンの内側になる
    return cnt % 2 == 1;
}

//ポリゴン同士の当たり判定
function hitPolygon(poly1, poly2){
    //辺の交差判定
    for(let i=0; i<poly1.length; ++i){
        for(let j=0; j<poly2.length; ++j){
            let vs1 = poly1[i];
            let ve1 = poly1[(i+1)%poly1.length];
            let vs2 = poly2[j];
            let ve2 = poly2[(j+1)%poly2.length];
            if(clossLine(vs1.x, vs1.y, ve1.x, ve1.y, vs2.x, vs2.y, ve2.x, ve2.y)){
                return true;
            }
        }
    }
    
    //点の内外判定（辺の交差に引っかからないパターンは一方がもう一方を完全に内包しているパターンしか無いため、一つの点について判定すれば十分
    if(pointInPolygon(poly1[1], poly2)){
        return true;
    }
    if(pointInPolygon(poly2[1], poly1)){
        return true;
    }

    return false;
}

function main(){

    const startTime = performance.now();
    let objectNum = 0;

    let canvas = new Canvas('cv');

    let stars = [];
    for(let i=0; i<objectNum; ++i){
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let r = Math.random() * 20 + 5;
        let a = Math.random() * 360;
        stars.push(new Star(x, y, r, a));
    }

    //以下は辺が交差しないがヒットしているサンプルのオブジェクト
    stars.push(new Star(350, 250, 50, -90));
    stars.push(new Star(350, 250, 10, -90));
    //stars.push(new Star(550, 250, 10, -90));
    //stars.push(new Star(550, 250, 25, -90));

    //総当り
    for(let i=0; i<stars.length; ++i){
        for(let j=i+1; j<stars.length; ++j){
            if(hitPolygon(stars[i].points, stars[j].points)){
                stars[i].isHit = true;
                stars[j].isHit = true;
            }
        }
    }
    
    for(let i=0; i<stars.length; ++i){
        canvas.draw(stars[i].points, stars[i].isHit);
    }

    const endTime = performance.now();
    let performanceTime = Math.round((endTime - startTime)*1000)/1000
    let resultp = document.getElementById('result');
    resultp.innerHTML = 'オブジェクト数：' + objectNum + '、時間：' + performanceTime + 'ミリ秒'
}

main();