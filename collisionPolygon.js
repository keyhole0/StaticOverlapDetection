
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
class Rect{
    constructor(t,b,l,r){
        this.t = t;
        this.b = b;
        this.l = l;
        this.r = r;
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
        this.rect = this.createRect();
    }
    setImageData(imagedata){
        this.imagedata = imagedata;
    }
    createRect(){
        let v = this.points[0];
        let r = new Rect(v.y, v.y, v.x, v.x);
        for(let i=1; i<this.points.length; ++i){
            r.t = Math.min(r.t, this.points[i].y);
            r.b = Math.max(r.b, this.points[i].y);
            r.l = Math.min(r.l, this.points[i].x);
            r.r = Math.max(r.r, this.points[i].x);
        }
        return r;
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
    let sumAngle = 0;
    for(let i=0; i<polygon.length; ++i){
        let vs1 = polygon[i];
        let ve1 = polygon[(i+1)%polygon.length];
        sumAngle += threePointAngle(vs1, point, ve1);
    }
    //合計絶対値が360°だったら内側、0°だったら外側なので誤差を考慮して少し大きい値で区切る。
    return Math.abs(sumAngle) > 1;
}

//3点の内角を計算（向きあり）
function threePointAngle(p1, p2, p3){
    let vec1 = p1.sub(p2);
    let vec2 = p3.sub(p2);
    let angle = vec2.angle() - vec1.angle();
    if(angle > Math.PI){
        angle -= Math.PI * 2;
    }
    if(angle <= -Math.PI){
        angle += Math.PI * 2;
    }
    return angle;
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
    if(pointInPolygon(poly1[0], poly2)){
        return true;
    }
    if(pointInPolygon(poly2[0], poly1)){
        return true;
    }

    return false;
}

function hitRect(rect1, rect2){
    return (
           rect1.t <= rect2.b
        && rect1.b >= rect2.t
        && rect1.l <= rect2.r
        && rect1.r >= rect2.l
    );
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

    //以下は辺が交差しないがヒットしているサンプルのオブジェクト
    //stars.push(new Star(350, 250, 50, -90));
    //stars.push(new Star(350, 250, 10, -90));
    //stars.push(new Star(550, 250, 10, -90));
    //stars.push(new Star(550, 250, 25, -90));

    //総当り
    for(let i=0; i<stars.length; ++i){
        for(let j=i+1; j<stars.length; ++j){
            if( hitRect(stars[i].rect, stars[j].rect) && 
                hitPolygon(stars[i].points, stars[j].points)){
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