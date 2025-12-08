/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
var SKY_URL = "https://mrdoognoog.github.io/csc461p5/sky.png"
var HILLS_URL = "https://mrdoognoog.github.io/csc461p5/hills.png"
var defaultEye = vec3.fromValues(0.5,0.5,0.5); // default eye position in world space
var defaultCenter = vec3.fromValues(0.5,0.5,0.5); // default view direction in world space
var defaultUp = vec3.fromValues(0,1,0); // default view up vector
var lightAmbient = vec3.fromValues(1,1,1); // default light ambient emission
var lightDiffuse = vec3.fromValues(1,1,1); // default light diffuse emission
var lightSpecular = vec3.fromValues(1,1,1); // default light specular emission
var lightPosition = vec3.fromValues(-5.5,5.5,-5.5); // default light position
var rotateTheta = Math.PI/100; // how much to rotate models by with each key press

var spinAngle = 0;
var spinSpeed = 0.01;

/* webgl and geometry data */
var gl = null; // the all powerful gl object. It's all here folks!
var inputTriangles = []; // the triangle data as loaded from input files
var numTriangleSets = 0; // how many triangle sets in input scene
var inputEllipsoids = []; // the ellipsoid data as loaded from input files
var numEllipsoids = 0; // how many ellipsoids in the input scene
var vertexBuffers = []; // this contains vertex coordinate lists by set, in triples
var normalBuffers = []; // this contains normal component lists by set, in triples
var triSetSizes = []; // this contains the size of each triangle set
var triangleBuffers = []; // lists of indices into vertexBuffers by set, in triples
var uvBuffers = []; //buffer for UV arrays
var textures = [];
var viewDelta = 0.05; // how much to displace view with each key press

var texMode = 1; // toggle blending modes

/* shader parameter locations */
var vPosAttribLoc; // where to put position for vertex shader
// var vNormAttribLoc; //where to put normal for vertex shader
// var vTexAttribLoc; //where to put the texture for vertex shader
// var samplerULoc; //where to put the sampler for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc; // where to put project model view matrix for vertex shader
var ambientULoc; // where to put ambient reflecivity for fragment shader
var diffuseULoc; // where to put diffuse reflecivity for fragment shader
var specularULoc; // where to put specular reflecivity for fragment shader
var shininessULoc; // where to put specular exponent for fragment shader
var texModeULoc;//toggle blending modes

/* interaction variables */
var Eye = vec3.clone(defaultEye); // eye position in world space
var Center = vec3.clone(defaultCenter); // view direction in world space
var Up = vec3.clone(defaultUp); // view up vector in world space

/* game variables */
//var enemyPos = [1,-5]
let enemyPos = vec3.fromValues(1,0,-5);
let bulletDirection = vec3.fromValues(0, 0, -1);
let bulletSpeed = 0;
let bulletStartPos = vec3.create();
const BULLET_MAX_DISTANCE = 100.0;
const TANK_HIT_RADIUS = 2.0;
const MAP_MIN = -20;
const MAP_MAX = 20;

var lives = 3;
var score = 0;

//holds the coordinates of all the obstacles in the level. used for collision
var obstacles = [];
//var bulletPos = [0,0];
var bulletPos = vec3.fromValues(0,0,0);

// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input json file

// helper function that pretty-prints vec3s
function printVector(vec){
    return vec[0].toFixed(2) + "," + vec[1].toFixed(2) + "," + vec[2].toFixed(2)
}

// set up the webGL environment
function setupWebGL() {

    var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
    var cw = imageCanvas.width, ch = imageCanvas.height; 
    imageContext = imageCanvas.getContext("2d"); 
    
    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        //gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

var hillscroll = 0

function drawBg(){
    var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
    imageContext = imageCanvas.getContext("2d");

    var bkgdImage = new Image(); 
    bkgdImage.crossOrigin = "Anonymous";
    bkgdImage.src = SKY_URL;
    bkgdImage.onload = function(){
        var iw = bkgdImage.width, ih = bkgdImage.height;
        imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
    }
    
    var cw = imageCanvas.width, ch = imageCanvas.height; 
    //draw the hills
    var hillsImg = new Image();
    hillsImg.crossOrigin = "Anonymous";
    hillsImg.src = HILLS_URL;
    hillsImg.onload = function(){
        var iw = hillsImg.width, ih = hillsImg.height;
        imageContext.drawImage(hillsImg,hillscroll,0,iw,ih,0,0,cw,ch);
        imageContext.drawImage(hillsImg,hillscroll - iw,0,iw,ih,0,0,cw,ch);
        imageContext.drawImage(hillsImg,hillscroll + iw,0,iw,ih,0,0,cw,ch);
    }

    //hillscroll++
    //hillscroll =  hillscroll % hillsImg.width;
}

function drawHud(){

    //set up the HUD
    var hudCanvas = document.getElementById("myHudCanvas");
    let hudCtx = hudCanvas.getContext("2d");

    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

    let cw = hudCanvas.width;

    const cx = cw / 2;   // radar center X
    const cy = 50;       // radar center Y
    const radius = 40;   // radar radius

    // draw the crosshair
    hudCtx.strokeStyle = "yellow";
    hudCtx.beginPath();
    hudCtx.moveTo(256 - 10, 256);
    hudCtx.lineTo(256 + 10, 256);
    hudCtx.moveTo(256, 256 - 10);
    hudCtx.lineTo(256, 256 + 10);
    hudCtx.stroke();

    //draw the radar
    const radarScale = 0.5;

    for (let i = 0; i < 1; i++) {
        let ex = enemyPos[0];
        let ey = enemyPos[2];

        // 1. relative position to player
        let dx = ex - Eye[0];
        let dy = ey - Eye[2];

        // 2. rotate by negative player angle so radar follows facing direction
        let cosA = Math.cos(-yaw);
        let sinA = Math.sin(-yaw);

        let rx = dx * cosA - dy * sinA;
        let ry = dx * sinA + dy * cosA;

        // 3. scale world distance into radar distance
        rx /= radarScale;
        ry /= radarScale;

        // 4. screen coordinates (radar center)
        let bx = cx + rx;
        let by = cy + ry;

        // 5. check if inside radar circle
        if ((rx * rx + ry * ry) <= radius * radius) {
            hudCtx.beginPath();
            hudCtx.fillStyle = "red";
            hudCtx.arc(bx, by, 3, 0, 2 * Math.PI);
            hudCtx.fill();
        }
    }

    hudCtx.beginPath();
    hudCtx.arc(cx, cy, radius, 0, 2 * Math.PI);
    
    hudCtx.stroke();

    //spin the radar
    radarAngle += 0.04;

    // compute end point of radar line
    let x2 = cx + radius * Math.cos(radarAngle);
    let y2 = cy + radius * Math.sin(radarAngle);

    //draw radar line
    hudCtx.beginPath();
    hudCtx.moveTo(cx, cy);
    hudCtx.lineTo(x2, y2);
    hudCtx.stroke();

    // lives display
    hudCtx.font = "20px Arial";
    hudCtx.fillStyle = "yellow";
    hudCtx.fillText("Lives: " + lives, 20, 40);
    hudCtx.fillText("Score: " + score, 320, 40);
    //debug displays
    hudCtx.fillText(printVector(Eye), 20, 60);
    hudCtx.fillText(yaw.toFixed(2),160, 60);
    hudCtx.fillText("OBSTACLES", 20, 80);
    for(var i = 0; i < obstacles.length; i++){
        hudCtx.fillText(printVector(obstacles[i]),20, 100 + (i*20));
    }

    hudCtx.fillText("ENEMY POSITION", 320,60);
    var ep = vec3.fromValues(enemyPos[0],0,enemyPos[2]);
    hudCtx.fillText(printVector(ep), 320,80);
    hudCtx.fillText("BULLET POSITION", 320,100);
    var bp = vec3.fromValues(bulletPos[0],0,bulletPos[2]);
    hudCtx.fillText(printVector(bp), 320,120);

}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
// taken from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
//
function loadTexture(gl, url) {
  console.log("loading texture " + url)
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image,
    );

    // WebGL1 has different requirements for power of 2 images
    // vs. non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  //make sure cross-origin scripting is enabled
  image.crossOrigin = "Anonymous";
  image.src = url;

  return texture;
}

//for WEBGL1.0 - textures must be power of 2
function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

// read models in, load them into webgl buffers
function loadModels() {

    
        inputTriangles = [];
        //add floors
  inputTriangles.push({
    "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.4,0.4], "specular": [0.3,0.3,0.3], "n": 11, "alpha": 1.0, "texture": "floor.png"}, 
    "vertices": [[-10, 0, 10],[10, 0, 10],[-10, 0, -10],[10,0,-10]],
    "normals": [[0, 0, -1],[0, 0,-1],[0, 0,-1],[0,0,-1]],
    "uvs": [[0,0], [1,0], [0,1], [1,1]],
    "triangles": [[0,1,2], [1,2,3]]
  })
  //render a bunch of obstacles
  for(var i = 0; i < 5; i++){
    //var offset = [(Math.random() * 10) - 5,(Math.random() * 10) - 5];
    var offset = [0,-2]
    inputTriangles.push({
        "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.4,0.4], "specular": [0.3,0.3,0.3], "n": 11, "alpha": 1.0, "texture": "mandrill.jpg"}, 
        "vertices": [
    [offset[0] - 0.5, 0, offset[1] + 0.5],
    [offset[0] - 0.5, 1, offset[1] + 0.5],
    [offset[0] + 0.5, 1, offset[1] + 0.5],
    [offset[0] + 0.5, 0, offset[1] + 0.5],

    [offset[0] - 0.5, 0, offset[1] - 0.5],
    [offset[0] - 0.5, 1, offset[1] - 0.5],
    [offset[0] + 0.5, 1, offset[1] - 0.5],
    [offset[0] + 0.5, 0, offset[1] - 0.5]
],
        // averaged normals: each one points diagonally out from cube center
    "normals": [
        [-0.577, -0.577,  0.577],   // 0
        [-0.577,  0.577,  0.577],   // 1
        [ 0.577,  0.577,  0.577],   // 2
        [ 0.577, -0.577,  0.577],   // 3

        [-0.577, -0.577, -0.577],   // 4
        [-0.577,  0.577, -0.577],   // 5
        [ 0.577,  0.577, -0.577],   // 6
        [ 0.577, -0.577, -0.577]    // 7
    ],
        "uvs": [[0,0], [0,1], [1,0], [1,1]],
        "triangles": [
        [0,1,2],[0,2,3],      // front
        [3,2,6],[3,6,7],      // right
        [6,7,5],[4,7,5],      // back
        [4,5,1],[4,1,0],      // left
        [0,3,4],[3,4,7],      // bottom
        [1,2,5],[2,5,6]       // top
    ]
    })
    obstacles.push(vec3.fromValues(offset[0],0.5,offset[1]));
  }

  //draw the tank
  var offset = enemyPos;
  var objScale = [0.5,0.5,0.5];
  var topOffset = 8;
  var cannonOffset = 16;
  var cannonPos = [offset[0] + 0.0, offset[2] + 0.75,-0.25];
    inputTriangles.push({
        "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.4,0.4], "specular": [0.3,0.3,0.3], "n": 11, "alpha": 1.0, "texture": "mandrill.jpg"}, 
        "vertices": [
            //base of the tank
    [offset[0] - objScale[0], 0, offset[2] + objScale[0]],
    [offset[0] - objScale[0], objScale[0], offset[2] + objScale[0]],
    [offset[0] + objScale[0], objScale[0], offset[2] + objScale[0]],
    [offset[0] + objScale[0], 0, offset[2] + objScale[0]],

    [offset[0] - objScale[0], 0, offset[2] - objScale[0]],
    [offset[0] - objScale[0], objScale[0], offset[2] - objScale[0]],
    [offset[0] + objScale[0], objScale[0], offset[2] - objScale[0]],
    [offset[0] + objScale[0], 0, offset[2] - objScale[0]],
    //top of the tank
    [offset[0] - objScale[0] / 2, 0+0.5, offset[2] + objScale[0] / 2],
    [offset[0] - objScale[0] / 2, (objScale[0] / 2)+0.5, offset[2] + objScale[0] / 2],
    [offset[0] + objScale[0] / 2, (objScale[0] / 2)+0.5, offset[2] + objScale[0] / 2],
    [offset[0] + objScale[0] / 2, 0+0.5, offset[2] + objScale[0] / 2],

    [offset[0] - objScale[0] / 2, 0+0.5, offset[2] - objScale[0] / 2],
    [offset[0] - objScale[0] / 2, (objScale[0] / 2)+0.5, offset[2] - objScale[0] / 2],
    [offset[0] + objScale[0] / 2, (objScale[0] / 2)+0.5, offset[2] - objScale[0] / 2],
    [offset[0] + objScale[0] / 2, 0+0.5, offset[2] - objScale[0] / 2],
    //tank cannon
    [cannonPos[0] - objScale[0] / 2, 0+0.5+cannonPos[2], cannonPos[1] + objScale[0] / 2],
    [cannonPos[0] - objScale[0] / 2, (objScale[0] / 2)+0.5+cannonPos[2], cannonPos[1] + objScale[0] / 2],
    [cannonPos[0] + objScale[0] / 2, (objScale[0] / 2)+0.5+cannonPos[2], cannonPos[1] + objScale[0] / 2],
    [cannonPos[0] + objScale[0] / 2, 0+0.5+cannonPos[2], cannonPos[1] + objScale[0] / 2],

    [cannonPos[0] - objScale[0] / 2, 0+0.5+cannonPos[2], cannonPos[1] - objScale[0] / 2],
    [cannonPos[0] - objScale[0] / 2, (objScale[0] / 2)+0.5+cannonPos[2], cannonPos[1] - objScale[0] / 2],
    [cannonPos[0] + objScale[0] / 2, (objScale[0] / 2)+0.5+cannonPos[2], cannonPos[1] - objScale[0] / 2],
    [cannonPos[0] + objScale[0] / 2, 0+0.5+cannonPos[2], cannonPos[1] - objScale[0] / 2]
],
        // averaged normals: each one points diagonally out from cube center
    "normals": [
        //base of the tank
        [-0.577, -0.577,  0.577],   // 0
        [-0.577,  0.577,  0.577],   // 1
        [ 0.577,  0.577,  0.577],   // 2
        [ 0.577, -0.577,  0.577],   // 3

        [-0.577, -0.577, -0.577],   // 4
        [-0.577,  0.577, -0.577],   // 5
        [ 0.577,  0.577, -0.577],   // 6
        [ 0.577, -0.577, -0.577],    // 7
        //top of the tank
        [-0.577, -0.577,  0.577],   // 0
        [-0.577,  0.577,  0.577],   // 1
        [ 0.577,  0.577,  0.577],   // 2
        [ 0.577, -0.577,  0.577],   // 3

        [-0.577, -0.577, -0.577],   // 4
        [-0.577,  0.577, -0.577],   // 5
        [ 0.577,  0.577, -0.577],   // 6
        [ 0.577, -0.577, -0.577],    // 7
        //cannon
        [-0.577, -0.577,  0.577],   // 0
        [-0.577,  0.577,  0.577],   // 1
        [ 0.577,  0.577,  0.577],   // 2
        [ 0.577, -0.577,  0.577],   // 3

        [-0.577, -0.577, -0.577],   // 4
        [-0.577,  0.577, -0.577],   // 5
        [ 0.577,  0.577, -0.577],   // 6
        [ 0.577, -0.577, -0.577],    // 7
    ],
        "uvs": [[0,0], [0,1], [1,0], [1,1]],
        "triangles": [
            //base of the tank
        [0,1,2],[0,2,3],      // front
        [3,2,6],[3,6,7],      // right
        [6,7,5],[4,7,5],      // back
        [4,5,1],[4,1,0],      // left
        [0,3,4],[3,4,7],      // bottom
        [1,2,5],[2,5,6],       // top
        //top of the tank
        [0+topOffset,1+topOffset,2+topOffset],[0+topOffset,2+topOffset,3+topOffset],      // front
        [3+topOffset,2+topOffset,6+topOffset],[3+topOffset,6+topOffset,7+topOffset],      // right
        [6+topOffset,7+topOffset,5+topOffset],[4+topOffset,7+topOffset,5+topOffset],      // back
        [4+topOffset,5+topOffset,1+topOffset],[4+topOffset,1+topOffset,0+topOffset],      // left
        [0+topOffset,3+topOffset,4+topOffset],[3+topOffset,4+topOffset,7+topOffset],      // bottom
        [1+topOffset,2+topOffset,5+topOffset],[2+topOffset,5+topOffset,6+topOffset],       // top
        //cannon
        [0+cannonOffset,1+cannonOffset,2+cannonOffset],[0+cannonOffset,2+cannonOffset,3+cannonOffset],      // front
        [3+cannonOffset,2+cannonOffset,6+cannonOffset],[3+cannonOffset,6+cannonOffset,7+cannonOffset],      // right
        [6+cannonOffset,7+cannonOffset,5+cannonOffset],[4+cannonOffset,7+cannonOffset,5+cannonOffset],      // back
        [4+cannonOffset,5+cannonOffset,1+cannonOffset],[4+cannonOffset,1+cannonOffset,0+cannonOffset],      // left
        [0+cannonOffset,3+cannonOffset,4+cannonOffset],[3+cannonOffset,4+cannonOffset,7+cannonOffset],      // bottom
        [1+cannonOffset,2+cannonOffset,5+cannonOffset],[2+cannonOffset,5+cannonOffset,6+cannonOffset],       // top
    ]
    })
    obstacles.push(vec3.fromValues(offset[0],0.5,offset[2]));

  
        
    //draw in the bullet (spawn offscreen for now)
    inputTriangles.push({
        "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.4,0.4], "specular": [0.3,0.3,0.3], "n": 11, "alpha": 1.0, "texture": "mandrill.jpg"}, 
        "vertices": [
    [bulletPos[0] - 0.25, 0.25, bulletPos[2] + 0.25],
    [bulletPos[0] - 0.25, 0.75, bulletPos[2] + 0.25],
    [bulletPos[0] + 0.25, 0.75, bulletPos[2] + 0.25],
    [bulletPos[0] + 0.25, 0.25, bulletPos[2] + 0.25],

    [bulletPos[0] - 0.25, 0.25, bulletPos[2] - 0.25],
    [bulletPos[0] - 0.25, 0.75, bulletPos[2] - 0.25],
    [bulletPos[0] + 0.25, 0.75, bulletPos[2] - 0.25],
    [bulletPos[0] + 0.25, 0.25, bulletPos[2] - 0.25]
],
        // averaged normals: each one points diagonally out from cube center
    "normals": [
        [-0.577, -0.577,  0.577],   // 0
        [-0.577,  0.577,  0.577],   // 1
        [ 0.577,  0.577,  0.577],   // 2
        [ 0.577, -0.577,  0.577],   // 3

        [-0.577, -0.577, -0.577],   // 4
        [-0.577,  0.577, -0.577],   // 5
        [ 0.577,  0.577, -0.577],   // 6
        [ 0.577, -0.577, -0.577]    // 7
    ],
        "uvs": [[0,0], [0,1], [1,0], [1,1]],
        "triangles": [
        [0,1,2],[0,2,3],      // front
        [3,2,6],[3,6,7],      // right
        [6,7,5],[4,7,5],      // back
        [4,5,1],[4,1,0],      // left
        [0,3,4],[3,4,7],      // bottom
        [1,2,5],[2,5,6]       // top
    ]
    })

        //inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles"); // read in the triangle data


    try {
        if (inputTriangles == String.null)
            throw "Unable to load triangles file!";
        else {
            var whichSetVert; // index of vertex in current triangle set
            var whichSetTri; // index of triangle in current triangle set
            var vtxToAdd; // vtx coords to add to the coord array
            var normToAdd; // vtx normal to add to the coord array
            var uvToAdd; // uv coordinate to add to the uv array
            var triToAdd; // tri indices to add to the index array
            var maxCorner = vec3.fromValues(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE); // bbox corner
            var minCorner = vec3.fromValues(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE); // other corner
        
            // process each triangle set to load webgl vertex and triangle buffers
            numTriangleSets = inputTriangles.length; // remember how many tri sets
            for (var whichSet=0; whichSet<numTriangleSets; whichSet++) { // for each tri set
                
                // set up highlighting, modeling translation and rotation
                inputTriangles[whichSet].center = vec3.fromValues(0,0,0);  // center point of tri set
                inputTriangles[whichSet].on = false; // not highlighted
                inputTriangles[whichSet].translation = vec3.fromValues(0,0,0); // no translation
                inputTriangles[whichSet].xAxis = vec3.fromValues(1,0,0); // model X axis
                inputTriangles[whichSet].yAxis = vec3.fromValues(0,1,0); // model Y axis 

                // set up the vertex and normal arrays, define model center and axes
                inputTriangles[whichSet].glVertices = []; // flat coord list for webgl
                inputTriangles[whichSet].glNormals = []; // flat normal list for webgl
                inputTriangles[whichSet].glUVs = []; // flat uv list for webgl

                var numVerts = inputTriangles[whichSet].vertices.length; // num vertices in tri set
                
                for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) { // verts in set
                    vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert]; // get vertex to add
                    normToAdd = inputTriangles[whichSet].normals[whichSetVert]; // get normal to add
                    
                    inputTriangles[whichSet].glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
                    inputTriangles[whichSet].glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // put normal in set coord list
                    
                    //add texture coordinates, if present
                    if(inputTriangles[whichSet].uvs && inputTriangles[whichSet].uvs[whichSetVert]){
                        uvToAdd = inputTriangles[whichSet].uvs[whichSetVert];

                        //invert horizontal textures
                        uvToAdd[0] = 1.0 - uvToAdd[0];
                        
                        inputTriangles[whichSet].glUVs.push(uvToAdd[0], uvToAdd[1]);
                    }

                    // //add alphas, if present (if not render opaque)
                    // if(inputTriangles[whichSet].material.alpha){
                        
                    // }
                    
                    vec3.max(maxCorner,maxCorner,vtxToAdd); // update world bounding box corner maxima
                    vec3.min(minCorner,minCorner,vtxToAdd); // update world bounding box corner minima
                    vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd); // add to ctr sum
                } // end for vertices in set
                vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts); // avg ctr sum

                // send the vertex coords and normals to webGL
                vertexBuffers[whichSet] = gl.createBuffer(); // init empty webgl set vertex coord buffer
                gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichSet]); // activate that buffer
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glVertices),gl.STATIC_DRAW); // data in
                normalBuffers[whichSet] = gl.createBuffer(); // init empty webgl set normal component buffer
                gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichSet]); // activate that buffer
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glNormals),gl.STATIC_DRAW); // data in
            
                //send the uv coords to webGL
                if (inputTriangles[whichSet].glUVs.length > 0){
                    uvBuffers[whichSet] = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffers[whichSet]);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inputTriangles[whichSet].glUVs), gl.STATIC_DRAW);
                }
                
                // set up the triangle index array, adjusting indices across sets
                inputTriangles[whichSet].glTriangles = []; // flat index list for webgl
                triSetSizes[whichSet] = inputTriangles[whichSet].triangles.length; // number of tris in this set
                for (whichSetTri=0; whichSetTri<triSetSizes[whichSet]; whichSetTri++) {
                    triToAdd = inputTriangles[whichSet].triangles[whichSetTri]; // get tri to add
                    inputTriangles[whichSet].glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list
                } // end for triangles in set

                // send the triangle indices to webGL
                triangleBuffers.push(gl.createBuffer()); // init empty triangle index buffer
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]); // activate that buffer
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(inputTriangles[whichSet].glTriangles),gl.STATIC_DRAW); // data in

                //load textures
                if (inputTriangles[whichSet].material && inputTriangles[whichSet].material.texture) {
                    textures[whichSet] = loadTexture(gl, 
                        "https://mrdoognoog.github.io/csc461p4/" + inputTriangles[whichSet].material.texture);
                } else {
                    console.warn("No texture found for model " + whichSet);
                }

            } // end for each triangle set 
        
        } // end if triangle file loaded
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end load models

// setup the webGL shaders
function setupShaders() {
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = /*glsl*/`
        attribute vec3 aVertexPosition; // vertex position
        attribute vec3 aVertexNormal; // vertex normal
        attribute vec2 aTexCoord; //texture coordinate
        
        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        
        varying vec2 vTexCoord; //pass to fragment shader
        varying vec3 vWorldPos; // interpolated world position of vertex
        varying vec3 vVertexNormal; // interpolated normal for frag shader

        void main(void) {
            
            // vertex position
            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

            // vertex normal (assume no non-uniform scale)
            vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
            vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z)); 
        
            //pass texture coordinate through
            vTexCoord = aTexCoord;
        }
    `;
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = /*glsl*/`
        precision mediump float; // set float to medium precision

        uniform sampler2D uSampler; //the texture sampler

        // eye location
        uniform vec3 uEyePosition; // the eye's position in world
        
        // light properties
        uniform vec3 uLightAmbient; // the light's ambient color
        uniform vec3 uLightDiffuse; // the light's diffuse color
        uniform vec3 uLightSpecular; // the light's specular color
        uniform vec3 uLightPosition; // the light's position

        uniform int uTexMode; //texture mode
        
        // material properties
        uniform vec3 uAmbient; // the ambient reflectivity
        uniform vec3 uDiffuse; // the diffuse reflectivity
        uniform vec3 uSpecular; // the specular reflectivity
        uniform float uShininess; // the specular exponent
        
        // geometry properties
        varying vec3 vWorldPos; // world xyz of fragment
        varying vec3 vVertexNormal; // normal of fragment
        varying vec2 vTexCoord; //interpolate texture coordinate
            
        void main(void) {

            //sample the texture
            vec4 texColor = texture2D(uSampler, vTexCoord);

            //normalize vectors
            vec3 normal = normalize(vVertexNormal); 
            vec3 light = normalize(uLightPosition - vWorldPos);
            vec3 eye = normalize(uEyePosition - vWorldPos);
            vec3 halfVec = normalize(light+eye);

            // ambient term
            vec3 ambient = uAmbient*uLightAmbient; 
            
            // diffuse term
            float lambert = max(0.0,dot(normal,light));
            vec3 diffuse = uDiffuse*uLightDiffuse*lambert; // diffuse term
            
            // specular term
            float highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
            vec3 specular = uSpecular*uLightSpecular*highlight; // specular term
            
            // combine lighting
            vec3 lighting = ambient + diffuse + specular;

            // combine based on mode
            vec3 colorOut;
            if (uTexMode == 0)
                colorOut = texColor.rgb;            // REPLACE
            else
                colorOut = texColor.rgb * lighting; // MODULATE
            
            // vec3 colorOut = ambient + diffuse + specular; // no specular yet
            // gl_FragColor = vec4(colorOut, 1.0); 

            gl_FragColor = vec4(colorOut, texColor.a);
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // ptr to vertex normal attrib
                gl.enableVertexAttribArray(vNormAttribLoc); // connect attrib to array
                
                //texture attributes
                vTexAttribLoc = gl.getAttribLocation(shaderProgram, "aTexCoord");
                gl.enableVertexAttribArray(vTexAttribLoc);
                
                // locate vertex uniforms
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
                
                samplerULoc = gl.getUniformLocation(shaderProgram, "uSampler");
                gl.uniform1i(samplerULoc, 0); //texture unit 0
                
                // locate fragment uniforms
                var eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition"); // ptr to eye position
                var lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // ptr to light ambient
                var lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // ptr to light diffuse
                var lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // ptr to light specular
                var lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); // ptr to light position
                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // ptr to ambient
                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // ptr to diffuse
                specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // ptr to specular
                shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // ptr to shininess

                texModeULoc = gl.getUniformLocation(shaderProgram, "uTexMode");
                gl.uniform1i(texModeULoc, texMode);
                
                // pass global constants into fragment uniforms
                gl.uniform3fv(eyePositionULoc,Eye); // pass in the eye's position
                gl.uniform3fv(lightAmbientULoc,lightAmbient); // pass in the light's ambient emission
                gl.uniform3fv(lightDiffuseULoc,lightDiffuse); // pass in the light's diffuse emission
                gl.uniform3fv(lightSpecularULoc,lightSpecular); // pass in the light's specular emission
                gl.uniform3fv(lightPositionULoc,lightPosition); // pass in the light's position
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

let keyState = {};

document.addEventListener('keydown', function(e) {
    keyState[e.key] = true;
});

document.addEventListener('keyup', function(e) {
    keyState[e.key] = false;
});

Up = vec3.fromValues(0, 1, 0);
forward = vec3.fromValues(0, 0, -1);  // initial facing direction
yaw = 0; // in radians

var radarAngle = 0;

function determineCollision(pos,obj){
    cubeSize = 0.8;
    playerRadius = 0.2;
    // Distance between player and obstacle center
    let dx = Math.abs(pos[0] - obj[0]);
    let dz = Math.abs(pos[2] - obj[2]);

    // Allowed distance before collision happens
    let allowedX = cubeSize + playerRadius;
    let allowedZ = cubeSize + playerRadius;

    // If player is too close on both axes -> collision
    return (dx < allowedX && dz < allowedZ);
}

// render the loaded model
function renderModels() {

    
    // construct the model transform matrix, based on model state
    function makeModelTransform(currModel) {
        var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

        // move the model to the origin
        mat4.fromTranslation(mMatrix,vec3.negate(negCtr,currModel.center)); 
        
        // scale for highlighting if needed
        if (currModel.on)
            mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(1.2,1.2,1.2)),mMatrix); // S(1.2) * T(-ctr)
        
        // rotate the model to current interactive orientation
        vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis)); // get the new model z axis
        mat4.set(sumRotation, // get the composite rotation
            currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
            currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
            currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
            0, 0,  0, 1);
        mat4.multiply(mMatrix,sumRotation,mMatrix); // R(ax) * S(1.2) * T(-ctr)
        
        // translate back to model center
        mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.center),mMatrix); // T(ctr) * R(ax) * S(1.2) * T(-ctr)

        // translate model to current interactive orientation
        mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.translation),mMatrix); // T(pos)*T(ctr)*R(ax)*S(1.2)*T(-ctr)
        
    } // end make model transform
    
    // var hMatrix = mat4.create(); // handedness matrix
    var pMatrix = mat4.create(); // projection matrix
    var vMatrix = mat4.create(); // view matrix
    var mMatrix = mat4.create(); // model matrix
    var pvMatrix = mat4.create(); // hand * proj * view matrices

    //spinAngle += spinSpeed;

    //helper function that draws a single shape
    function drawModel(currSet, whichTriSet, pvMatrix){

        var pvmMatrix = mat4.create(); // hand * proj * view * model matrices

        // make model transform, add to view project
        makeModelTransform(currSet);
        mat4.rotateY(mMatrix, mMatrix, spinAngle);

        mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
        
        gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
        gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
        
        // reflectivity: feed to the fragment shader
        gl.uniform3fv(ambientULoc,currSet.material.ambient); // pass in the ambient reflectivity
        gl.uniform3fv(diffuseULoc,currSet.material.diffuse); // pass in the diffuse reflectivity
        gl.uniform3fv(specularULoc,currSet.material.specular); // pass in the specular reflectivity
        gl.uniform1f(shininessULoc,currSet.material.n); // pass in the specular exponent
        
        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichTriSet]); // activate
        gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
        gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichTriSet]); // activate
        gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed

        //texture coordinate buffer
        if (uvBuffers && uvBuffers[whichTriSet]) {
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffers[whichTriSet]);
            gl.vertexAttribPointer(vTexAttribLoc, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vTexAttribLoc);
        }

        //bind the textures
        if (textures && textures[whichTriSet]) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[whichTriSet]);
            gl.uniform1i(samplerULoc, 0); // pass texture unit 0
        }

        gl.uniform1i(texModeULoc, texMode);

        // triangle buffer: activate and render
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[whichTriSet]); // activate
        gl.drawElements(gl.TRIANGLES,3*triSetSizes[whichTriSet],gl.UNSIGNED_SHORT,0); // render
    }

    //process movement
    let temp = vec3.create();
    let right = vec3.create();

    const dirEnum = {NEGATIVE: -1, POSITIVE: 1}; // enumerated rotation direction
    
    //update yaw based on keys
    if(keyState["ArrowLeft"]) {
        hillscroll--;
        yaw -= rotateTheta;
    }
    if(keyState["ArrowRight"]) {
        hillscroll++;
        yaw += rotateTheta;
    }

    //recompute forward from the yaw
    forward[0] = Math.sin(yaw);
    forward[1] = 0;
    forward[2] = -Math.cos(yaw);
    vec3.normalize(forward,forward)

    //compute the right vector
    vec3.cross(right,forward, Up)
    vec3.normalize(right, right)
    

    //move forward and back
    if(keyState["ArrowUp"]){
        vec3.scale(temp, forward, viewDelta);
    }

    if(keyState["ArrowDown"]){
        vec3.scale(temp, forward, -viewDelta);
            
    }

    //process collision
    var colliding = false;
    for(var i = 0; i < obstacles.length; i++){
        colcheck = vec3.add(vec3.create(), Eye, temp);
        if(determineCollision(colcheck, obstacles[i])){
            colliding = true;
        }
    }
    if(!colliding) vec3.add(Eye, Eye, temp);
        

    //keep center in front of the eye
    vec3.add(Center, Eye, forward);

    //cannonfire (unfinished)
    bulletModel = inputTriangles[7];
    if (keyState[" "] && !spaceWasDown) {

        console.log("blam!");

        // Put bullet at the player's eye
        vec3.copy(bulletModel.translation, Eye);

        // Compute firing direction based on camera yaw
        vec3.set(
            bulletDirection,
            Math.sin(yaw),   // x
            0,               // y
            -Math.cos(yaw)   // z
        );

        vec3.normalize(bulletDirection, bulletDirection);

        bulletSpeed = 0.1; // whatever speed you want

        // Record starting point for distance tracking
        vec3.copy(bulletStartPos, bulletModel.translation);
    }

    spaceWasDown = keyState[" "];

    //respawn the enemy tank after it has been hit
    function respawnEnemy(enemyModel) {
        let rx = MAP_MIN + Math.random() * (MAP_MAX - MAP_MIN);
        let rz = MAP_MIN + Math.random() * (MAP_MAX - MAP_MIN);

        vec3.set(enemyModel.translation, rx, enemyModel.translation[1], rz);
    }

    //set up distances
    let bulletDist = vec3.distance(enemyPos, bulletPos);

    //register a hit, reset the enemy
    if (bulletDist < TANK_HIT_RADIUS) {
        console.log("HIT!");
        score += 100;

        resetBullet();
        respawnEnemy(enemyModel);
    }

    //reset the bullet, put it back to a "parking place" (far away where nothing would reach it)
    function resetBullet() {
        bulletSpeed = 0;

        // Optionally hide the bullet by putting it far away
        vec3.set(bulletModel.translation, 9999, 9999, 9999);

        // (Optional) zero direction
        vec3.set(bulletDirection, 0, 0, 0);
    }

    //move the bullet (if active)
    if (bulletSpeed > 0) {
        let delta = vec3.create();
        vec3.scale(delta, bulletDirection, bulletSpeed);
        vec3.add(bulletModel.translation, bulletModel.translation, delta);
        bulletPos[0] = bulletModel.translation[0];
        bulletPos[2] = bulletModel.translation[2];

        // Compute distance from starting point
        let dist = vec3.distance(bulletModel.translation, bulletStartPos);

        // Reset if too far
        if (dist > BULLET_MAX_DISTANCE) {
            resetBullet();
        }
    }

    //update enemy tank position(s)
    tankModel = inputTriangles[6];
    function translateModel(offset) {
        if (tankModel != null)
            vec3.add(tankModel.translation,tankModel.translation,offset);
    } // end translate model

    function rotateModel(axis,direction) {
        if (tankModel != null) {
            var newRotation = mat4.create();

            mat4.fromRotation(newRotation,direction*0.01,axis); // get a rotation matrix around passed axis
            vec3.transformMat4(tankModel.xAxis,tankModel.xAxis,newRotation); // rotate model x axis tip
            vec3.transformMat4(tankModel.yAxis,tankModel.yAxis,newRotation); // rotate model y axis tip
        } // end if there is a highlighted model
    } // end rotate model


    function turnTankTowardEye() {
    if (!tankModel) return;

    let tankYaw = Math.atan2(tankModel.xAxis[0], tankModel.xAxis[2]);

    let dx = Eye[0] - enemyPos[0];
    let dz = Eye[2] - enemyPos[2];

    let targetYaw = Math.atan2(dx, dz);

    // Compute smallest turning direction
    let diff = targetYaw - tankYaw;
    diff = (diff + Math.PI*3) % (Math.PI*2) - Math.PI; // wrap to [-π,π]

    // Apply limited turning speed
    let turnSpeed = 0.02; // radians per frame
    let turnAmt = Math.max(-turnSpeed, Math.min(turnSpeed, diff));

    // Rotate tank around Y
    let rot = mat4.create();
    mat4.fromYRotation(rot, turnAmt);

    vec3.transformMat4(tankModel.xAxis, tankModel.xAxis, rot);
    vec3.transformMat4(tankModel.yAxis, tankModel.yAxis, rot);
}

    //have the tank move around randomly
    //translateModel(vec3.fromValues(0.01,0,0.01));
    //rotateModel(Up, dirEnum.NEGATIVE);
    turnTankTowardEye();
    //enemyPos[0] += 0.01;
    //enemyPos[1] += 0.01;
    //update the collision map
    obstacles[5] = vec3.fromValues(enemyPos[0],0,enemyPos[2])

    //draw the background (bg) and foreground (hud)
    drawBg();
    drawHud();
    
    window.requestAnimationFrame(renderModels); // set up frame render callback
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // set up projection and view
    // mat4.fromScaling(hMatrix,vec3.fromValues(-1,1,1)); // create handedness matrix
    mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10); // create projection matrix
    mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
    mat4.multiply(pvMatrix,pvMatrix,pMatrix); // projection
    mat4.multiply(pvMatrix,pvMatrix,vMatrix); // projection * view

    //pass 1 - opaque objects
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    for (var whichTriSet = 0; whichTriSet < numTriangleSets; whichTriSet++) {
        var currSet = inputTriangles[whichTriSet];
        if (currSet.material.alpha === undefined || currSet.material.alpha === 1.0) {
            drawModel(currSet, whichTriSet, pvMatrix);
        }
    }

    //pass 2 - transparent objects
    var transparentModels = [];
    for (var whichTriSet = 0; whichTriSet < numTriangleSets; whichTriSet++) {
        var currSet = inputTriangles[whichTriSet];
        if (currSet.material.alpha < 1.0) {
            currSet._index = whichTriSet;
            transparentModels.push(currSet);
        }
    }

    // sort back-to-front
    transparentModels.sort((a, b) => {
        const da = vec3.distance(Eye, a.center);
        const db = vec3.distance(Eye, b.center);
        return db - da;
    });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    for (var model of transparentModels) {
        drawModel(model, model._index, pvMatrix);
    }

    // restore state
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    
} // end render model


/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadModels(); // load in the models from tri file
  setupShaders(); // setup the webGL shaders
  renderModels(); // draw the triangles using webGL

  //play audio when you click
//   const bgAudio = document.getElementById("bgAudio");
//     bgAudio.play().catch(e => {
//         console.log("Autoplay blocked — waiting for user interaction");
//         document.body.addEventListener('click', () => bgAudio.play(), { once: true });
//     });
  
} // end main