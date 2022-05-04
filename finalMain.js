'use strict';

// Global variables that are set and used
// across the application
let gl;
let time = 0;

// GLSL programs
let astroProgram;
let sunProgram;

// objects
var sphere = null;
var earth = null;
var sun = null;

// textures
let earthTex;
let moonTex;

// Coordinates and rotations for each body
var sunX = 0;
var sunY = 0;
var sunSize = 2;
var sunRot = 0;

let earthSunDist = 3;

var earthX = sunX + earthSunDist;
var earthY = sunY;
var earthSize = 0.6;
var earthRot = 0;

let moonEarthDist = 0.7;

var moonX = earthX + moonEarthDist;
var moonY = earthY;
var moonSize = 0.2;
var moonRot = 0;

let viewMatrix;
let followEarth = false;
let followMoon = false;

// Calcuate the position/rotation of each body based on time
// Each tick is equal to 1 hour of time
function updateWorld() {
    // Sun never moves

    // Earth's rotation about itself
    earthRot = time * Math.PI / 12.0;

    // Earth's rotation around the sun
    let earthAngle = time * Math.PI/(365*12);
    earthX = sunX + earthSunDist * Math.cos(earthAngle);
    earthY = sunY + earthSunDist * Math.sin(earthAngle);

    // Moon's rotation around the earth
    let moonAngle = time * Math.PI/(30*12);
    moonX = earthX + moonEarthDist * Math.cos(moonAngle);
    moonY = earthY + moonEarthDist * Math.sin(moonAngle);

    if (followEarth) {
        glMatrix.mat4.lookAt(viewMatrix, [earthX, earthY, 3], [earthX, earthY, 0], [0,1,0]);
    } else if (followMoon) {
        glMatrix.mat4.lookAt(viewMatrix, [moonX, moonY, 4], [moonX, moonY, 0], [0,1,0]);
    } else {
        glMatrix.mat4.lookAt(viewMatrix, [0, 0, 5], [0, 0,0],[0, 1, 0]);
    }
}

//
// create shapes and VAOs for objects.
// Note that you will need to bindVAO separately for each object / program based
// upon the vertex attributes found in each program
//
function createShapes() {
    sphere = new Sphere(20, 20);
    sphere.VAO = bindVAO(sphere, astroProgram);

    sun = new Sphere(20, 20);
    sun.VAO = bindVAO(sun, sunProgram);
}


//
// Here you set up your camera position, orientation, and projection
// Remember that your projection and view matrices are sent to the vertex shader
// as uniforms, using whatever name you supply in the shaders
//
function setUpCamera(program) {
    gl.useProgram (program);

    // set up your projection
    let projMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projMatrix, radians(100), 1, 1.0,300.0);
    gl.uniformMatrix4fv(program.proj, false, projMatrix);

    // set up your view
    viewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(viewMatrix, [0, 0, 5], [0, 0,0],[0, 1, 0]);
    gl.uniformMatrix4fv(program.view, false, viewMatrix);
}

// Get the shading stuff all set up
function setUpPhong(program) {
    gl.useProgram(program);
    let ambientLight = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
    let lightPosition = glMatrix.vec3.fromValues(sunX, sunY, 0);
    let highlightColor = glMatrix.vec3.fromValues(0.5, 0.5, 0.5);
    let lightColor = glMatrix.vec3.fromValues(1, 1, 1);

    let ka = 1.0;
    let kd = 0.8;
    let ks = 0.4;
    let ke = 0.2;

    gl.uniform3fv(program.ambientLight, ambientLight);
    gl.uniform3fv(program.lightPosition, lightPosition);
    gl.uniform3fv(program.lightColor, lightColor);
    gl.uniform3fv(program.highlightColor, highlightColor);
    gl.uniform1f(program.ka, ka);
    gl.uniform1f(program.kd, kd);
    gl.uniform1f(program.ks, ks);
    gl.uniform1f(program.ke, ke);
}

//
// load up the textures you will use in the shader(s)
// The setup for the globe texture is done for you
// Any additional images that you include will need to
// set up as well.
//
function setUpTextures(){
    // flip Y for WebGL
    gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, true);

    // get some texture space from the gpu
    earthTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, earthTex);

    // load the actual image
    var worldImage = document.getElementById ('earth-texture');
    worldImage.crossOrigin = "";

    // bind the texture so we can perform operations on it
    gl.bindTexture(gl.TEXTURE_2D, earthTex);

    // load the texture data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, worldImage.width, worldImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, worldImage);

    // set texturing parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    moonTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, moonTex);

    var moonImage = document.getElementById("moon-texture");
    worldImage.crossOrigin = "";

    // bind the texture so we can perform operations on it
    gl.bindTexture(gl.TEXTURE_2D, moonTex);

    // load the texture data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, moonImage.width, moonImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, moonImage);

    // set texturing parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}

//
//  This function draws all of the shapes required for your scene
//
function drawShapes() {
    // Draw Sun
    drawSun([1.0, 1.0, 0.0]);

    // Draw Earth
    drawSphere(earthX, earthY, earthSize, earthTex);

    // Draw Moon
    drawSphere(moonX, moonY, moonSize, moonTex);
}

function drawSphere(x, y, radius, texture) {
    gl.useProgram(astroProgram);

    gl.uniformMatrix4fv(astroProgram.view, false, viewMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(astroProgram.uSampler, 0);

    let matrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(matrix, matrix, glMatrix.vec3.fromValues(x, y, 0));
    glMatrix.mat4.scale(matrix, matrix, glMatrix.vec3.fromValues(radius, radius, radius))
    gl.uniformMatrix4fv(astroProgram.model, false, matrix);

    gl.bindVertexArray(sphere.VAO);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

}

function drawSun(color) {
    gl.useProgram(sunProgram);

    gl.uniformMatrix4fv(sunProgram.view, false, viewMatrix);

    let matrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(matrix, matrix, glMatrix.vec3.fromValues(sunX, sunY, 0));
    glMatrix.mat4.scale(matrix, matrix, glMatrix.vec3.fromValues(sunSize, sunSize, sunSize));
    gl.uniformMatrix4fv(sunProgram.model, false, matrix);
    gl.uniform3fv(sunProgram.color, glMatrix.vec3.fromValues(color[0], color[1], color[2]));

    gl.uniform1f(sunProgram.time, time);

    gl.bindVertexArray(sun.VAO);
    gl.drawElements(gl.TRIANGLES, sun.indices.length, gl.UNSIGNED_SHORT, 0);
}


  //
  // Use this function to create all the programs that you need
  // You can make use of the auxillary function initProgram
  // which takes the name of a vertex shader and fragment shader
  //
  // Note that after successfully obtaining a program using the initProgram
  // function, you will beed to assign locations of attribute and unifirm variable
  // based on the in variables to the shaders.   This will vary from program
  // to program.
  //
  function initPrograms() {
      astroProgram = initProgram('wireframe-V', 'wireframe-F');
      setUpPhong(astroProgram);
      astroProgram.uSampler = gl.getUniformLocation(astroProgram, 'uSampler');
      setUpCamera(astroProgram);

      sunProgram = initProgram('sun-V', 'sun-F');
      sunProgram.time = gl.getUniformLocation(sunProgram, 'time');
      setUpCamera(sunProgram);
  }


  // creates a VAO and returns its ID
  function bindVAO (shape, program) {
      //create and bind VAO
      let theVAO = gl.createVertexArray();
      gl.bindVertexArray(theVAO);
      
      // create and bind vertex buffer
      let myVertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, myVertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.points), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(program.vertexPosition);
      gl.vertexAttribPointer(program.vertexPosition, 3, gl.FLOAT, false, 0, 0);

      // create and bind normals buffer
      let myNormalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, myNormalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.normals), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(program.normal);
      gl.vertexAttribPointer(program.normal, 3, gl.FLOAT, false, 0, 0);

      // create and bind uv buffer
      let myUVBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, myUVBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.uv), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(program.uv);
      gl.vertexAttribPointer(program.uv, 2, gl.FLOAT, false, 0, 0);
      
      // Setting up the IBO
      let myIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);

      // Clean
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      
      return theVAO;
  }


/////////////////////////////////////////////////////////////////////////////
//
//  You shouldn't have to edit anything below this line...but you can
//  if you find the need
//
/////////////////////////////////////////////////////////////////////////////

// Given an id, extract the content's of a shader script
// from the DOM and return the compiled shader
function getShader(id) {
  const script = document.getElementById(id);
  const shaderString = script.text.trim();

  // Assign shader depending on the type of shader
  let shader;
  if (script.type === 'x-shader/x-vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  }
  else if (script.type === 'x-shader/x-fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  }
  else {
    return null;
  }

  // Compile the shader using the supplied shader code
  gl.shaderSource(shader, shaderString);
  gl.compileShader(shader);

  // Ensure the shader is valid
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}


//
// compiles, loads, links and returns a program (vertex/fragment shader pair)
//
// takes in the id of the vertex and fragment shaders (as given in the HTML file)
// and returns a program object.
//
// will return null if something went wrong
//
function initProgram(vertex_id, fragment_id) {
    const vertexShader = getShader(vertex_id);
    const fragmentShader = getShader(fragment_id);

    // Create a program
    let program = gl.createProgram();
      
    // Attach the shaders to this program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Could not initialize shaders');
      return null;
    }

    // Use this program instance
    gl.useProgram(program);

    program.vertexPosition = gl.getAttribLocation(program, 'vertexPosition');
    program.normal = gl.getAttribLocation(program, 'normal');
    program.uv = gl.getAttribLocation(program, 'uv');
    program.view = gl.getUniformLocation(program, 'view');
    program.proj = gl.getUniformLocation(program, 'proj');
    program.model = gl.getUniformLocation(program, 'model');

    // Phong stuff...
    program.lightPosition = gl.getUniformLocation(program, 'lightPosition');
    program.lightColor = gl.getUniformLocation(program, 'lightColor');
    program.highlightColor = gl.getUniformLocation(program, 'highlightColor');
    program.ka = gl.getUniformLocation(program, 'ka');
    program.kd = gl.getUniformLocation(program, 'kd');
    program.ks = gl.getUniformLocation(program, 'ks');
    program.ke = gl.getUniformLocation(program, 'ke');

    return program;
}


  //
  // We call draw to render to our canvas
  //
  function draw() {
    // Clear the scene
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
    // draw your shapes
    drawShapes();

    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  // Entry point to our application
  function init() {

    // Retrieve the canvas
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) {
      console.error(`There is no canvas with id ${'webgl-canvas'} on this page.`);
      return null;
    }

    // deal with keypress
    window.addEventListener('keydown', gotKey ,false);

    // Retrieve a WebGL context
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.error(`There is no WebGL 2.0 context`);
        return null;
      }
      
    // deal with keypress
    window.addEventListener('keydown', gotKey ,false);
      
    // Set the clear color to be black
    gl.clearColor(0, 0, 0, 1);
      
    // some GL initialization
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.clearColor(0.0,0.0,0.0,1.0)
    gl.depthFunc(gl.LEQUAL)
    gl.clearDepth(1.0)

    // Read, compile, and link your shaders
    initPrograms();
    
    // create and bind your current object
    createShapes();

    setUpTextures();
    
    // do a draw
    draw();
    
      setInterval(() => {
          time += 1;
          updateWorld();
          draw();
      }, 1);
  }
