
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

class Polygon{
    constructor(){
        this.points = [];
    }
    add(point){
        this.points.push(point);
    }
    toRect(){
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

class DrawingInfo{
    constructor(polygon, color){
        this.polygon = polygon;
        this.color = color;
    }
}

class Star{
    constructor(x, y, r, angle){
        this.center = new Vector(x,y);
        this.r = r;
        this.angle = angle;
        this.polygon = this.createStarPolygon();
        this.isHit = false;
    }
    createStarPolygon(){
        let polygon = new Polygon();
        let rscale = [1, 0.4];
        let cnt = 0;
        for(let i=0; i<360; i+=36){
            let angleRad = Math.PI*2*(i+this.angle)/360;
            let starr = this.r * rscale[cnt%2];
            let px = starr * Math.cos(angleRad) + this.center.x;
            let py = starr * Math.sin(angleRad) + this.center.y;
            polygon.add(new Vector(px, py));
            cnt += 1;
        }
        return polygon;
    }
    toDrawingInfo(){
        let color = (this.isHit)? 'rgba(192, 80, 77, 0.5)':'rgba(0, 0, 0, 0.5)'
        return new DrawingInfo(this.polygon, color);
    }
    getPolygon(){
        return this.polygon;
    }
    onCollision(opponent){
        this.isHit = true;
    }
}

class Canvas{
    constructor(id){
        this.cvs = document.getElementById(id);
        this.ctx = this.cvs.getContext("2d");
        this.width = this.cvs.width;
        this.height = this.cvs.height;
    }

    draw(drawingInfo){
        let points = drawingInfo.polygon.points;
        let color = drawingInfo.color;

        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.moveTo(points[0].x, points[0].y);
        for(let i=1; i<points.length; ++i){
            this.ctx.lineTo(points[i].x, points[i].y); // 3.指定座標まで線を引く
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
}

class Collision{
    
    //線分同士の交差判定
    static clossLine(ax, ay, bx, by, cx, cy, dx, dy){
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
    static pointInPolygon(point, polygon){
        let sumAngle = 0;
        for(let i=0; i<polygon.length; ++i){
            let vs1 = polygon[i];
            let ve1 = polygon[(i+1)%polygon.length];
            sumAngle += Collision.threePointAngle(vs1, point, ve1);
        }
        //合計絶対値が360°だったら内側、0°だったら外側なので誤差を考慮して少し大きい値で区切る。
        return Math.abs(sumAngle) > 1;
    }

    //3点の内角を計算（向きあり）
    static threePointAngle(p1, p2, p3){
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

    //矩形の当たり判定
    static collisionRect(rect1, rect2){
        return (
               rect1.t <= rect2.b
            && rect1.b >= rect2.t
            && rect1.l <= rect2.r
            && rect1.r >= rect2.l
        );
    }

    //ポリゴン同士の当たり判定
    static collisionPolygon(poly1, poly2){
        //辺の交差判定
        for(let i=0; i<poly1.points.length; ++i){
            for(let j=0; j<poly2.points.length; ++j){
                let vs1 = poly1.points[i];
                let ve1 = poly1.points[(i+1)%poly1.points.length];
                let vs2 = poly2.points[j];
                let ve2 = poly2.points[(j+1)%poly2.points.length];
                if(Collision.clossLine(vs1.x, vs1.y, ve1.x, ve1.y, vs2.x, vs2.y, ve2.x, ve2.y)){
                    return true;
                }
            }
        }
        
        //点の内外判定（辺の交差に引っかからないパターンは一方がもう一方を完全に内包しているパターンしか無いため、一つの点について判定すれば十分
        if(Collision.pointInPolygon(poly1.points[0], poly2.points)
        || Collision.pointInPolygon(poly2.points[0], poly1.points)){
            return true;
        }

        return false;
    }

    //オブジェクト同士の衝突判定
    static detectionBetweenObjects(objects){
        //総当り
        for(let i=0; i<objects.length; ++i){
            for(let j=i+1; j<objects.length; ++j){
                let poly1 = objects[i].getPolygon();
                let poly2 = objects[j].getPolygon();

                if( Collision.collisionRect(poly1.toRect(), poly2.toRect()) && 
                Collision.collisionPolygon(poly1, poly2)){
                    objects[i].onCollision(objects[j]);
                    objects[j].onCollision(objects[i]);
                }
            }
        }
    }
}

function main(objectNum){
    let canvas = new Canvas('cv');
    let stars = [];

    for(let i=0; i<objectNum; ++i){
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let r = Math.random() * 20 + 5;
        let a = Math.random() * 360;
        stars.push(new Star(x, y, r, a));
    }

    Collision.detectionBetweenObjects(stars);
    
    for(let i=0; i<stars.length; ++i){
        canvas.draw(stars[i].toDrawingInfo());
    }
}

function checkPerformance(){
    const startTime = performance.now();

    let objectNum = 500;
    main(objectNum);

    const endTime = performance.now();
    let performanceTime = Math.round((endTime - startTime)*1000)/1000
    let resultp = document.getElementById('result');
    resultp.innerHTML = 'オブジェクト数：' + objectNum + '、時間：' + performanceTime + 'ミリ秒'
}

checkPerformance();