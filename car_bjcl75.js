// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  if(u_isLighting)\n' + 
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
        // Calculate the color due to diffuse reflection
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     v_Color = vec4(diffuse, a_Color.a);\n' +  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var WHEEL_STEP = 9.0;
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var g_xPosition = 0.0;
var g_zPosition = 0.0;
var g_yPosition = 0.0;
var w_turn = 0.0;
var w_angle = 0.0;
var d_angle = 0.0;
var speed = 0.0;
var w_speed = 0.0;
var vertical_velocity = 0.0;
var gravity_acc = 9.81;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
      !u_isLighting ) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([1, 3, 4]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(50, 25, 50, 0, 0, 0, 0, 1, 0);
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 120);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  /*
  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  };
  */

  var keys = {};

  $(document).keydown(function(event){
  	keys[event.which] = true;
  }).keyup(function(event){
  	delete keys[event.which];
  });

  function gameLoop(){
  	if(keys[87]){	// "W" is pressed
     	speed = speed*1.03 - 0.05;
      w_speed = w_speed - WHEEL_STEP;
  	}
  	if(keys[65]){		// "A" is pressed
      if(speed>0.05){
        g_yAngle = (g_yAngle - ANGLE_STEP*2) % 360;
      }else if(speed<-0.05){
        g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      }
  		w_angle = 35.0;
  	}
  	if(keys[83]){		// "S" is pressed
      speed = speed*1.03 + 0.05;
      w_speed = w_speed + WHEEL_STEP;
  	}
  	if(keys[68]){		// "D" is pressed
  		if(speed>0.05){
        g_yAngle = (g_yAngle + ANGLE_STEP*2) % 360;
      }else if(speed<-0.05){
        g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      }
  		w_angle = -35.0;
  	}
  	if(!(keys[68] || keys[65])){
  		w_angle = 0.0;
  	}
  	if(keys[70]){		// "F" is pressed
  		//open/close doors
      	if(d_angle == 0.0){
      		d_angle = 35.0;
      	}else{
      		d_angle = 0.0;
      	}
  	}
    if(keys[38]){
      g_yPosition = g_yPosition + 1;
    }
    if(keys[40]){
      g_yPosition = g_yPosition - 1;
    }
  	g_zPosition = g_zPosition + speed*parseFloat(Math.cos(g_yAngle*(3.1415926/180)).toFixed(2));
  	g_xPosition = g_xPosition + speed*parseFloat(Math.sin(g_yAngle*(3.1415926/180)).toFixed(2));
  	speed = speed/1.05;
  	w_turn = w_turn + w_speed;
  	w_speed = w_speed/1.05;

    //keeping car on the "ground"
    /*
    if(Math.abs(g_zPosition)>25){
      g_zPosition = -g_zPosition;
    }
    if(Math.abs(g_xPosition)>25){
      g_xPosition = -g_xPosition;
    }
    */
    if(g_yPosition>0){
      g_yPosition = g_yPosition - vertical_velocity*Math.exp(0.1).toFixed(3);
    }
    
    if(Math.abs(g_zPosition)>25){
      g_yAngle = 180 - g_yAngle;
    }
    if(Math.abs(g_xPosition)>25){
      g_yAngle = -g_yAngle;
    }

  	//console.log(keys);
    //set dynamic camera
    //viewMatrix.setLookAt(g_xPosition, 5, g_zPosition+13, 0, 0, g_zPosition-10, 0, 1, 0);
    //projMatrix.setPerspective(30, 1, 1, 100);
  	// Draw the scene
  	draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  	setTimeout(gameLoop, 20);
  }

  //draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  gameLoop();
}


function initVertexBuffers(gl, colors) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);

  /*
  var colors = new Float32Array([    // Colors
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
 ]);
 */


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

function initAxesVertexBuffers(gl) {

  var verticesColors = new Float32Array([
    // Vertex coordinates and color (for axes)
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b) 
     20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
     0.0,  20.0,   0.0,  1.0,  1.0,  1.0, 
     0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
     0.0,   0.0, -20.0,  1.0,  1.0,  1.0, 
     0.0,   0.0,  20.0,  1.0,  1.0,  1.0 
  ]);
  var n = 6;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();  
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  //gl.drawArrays(gl.LINES, 0, n);

  gl.uniform1i(u_isLighting, false); // Will apply lighting

  

  // Rotate, and then translate
  modelMatrix.setTranslate(0, -0.2, 0);  // Translation (No translation is supported here)
  //modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  //modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffers(gl, makeColor([1,0,0]));
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //Model the ground
  pushMatrix(modelMatrix);
    modelMatrix.scale(50.0, 0.0, 50.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.uniform1i(u_isLighting, true); // Will apply lighting

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffers(gl, makeColor([1,0,1]));
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  modelMatrix.setTranslate(g_xPosition, g_yPosition, g_zPosition+0.8);

  //Model the car
  //bottom
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.scale(1, 0.1, 2); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //roof
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0, 0.5, 0.2);  // Translation
    modelMatrix.scale(0.8, 0.1, 0.8); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //front
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0, 0.15, -0.6);
    modelMatrix.scale(1, 0.2, 0.7); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //back
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0, 0.2, 0.75);
    modelMatrix.scale(1, 0.25, 0.4); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //door left
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(-0.48, 0.15, -0.3);
    modelMatrix.rotate(-d_angle, 0, 1, 0);
    modelMatrix.translate(0, 0, 0.425);
    modelMatrix.scale(0.01, 0.25, 0.85); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //door right
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0.48, 0.15, -0.3);
    modelMatrix.rotate(d_angle, 0, 1, 0);
    modelMatrix.translate(0, 0, 0.425);
    modelMatrix.scale(0.01, 0.25, 0.85); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the wheels)
  var n = initVertexBuffers(gl, makeColor([0,1,1]));
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //column front left
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(-0.4, 0.35, -0.2);
    modelMatrix.rotate(35, 1, 0 ,0);	//get column at an angle
    modelMatrix.rotate(-17, 0, 0, 1);	//---
    modelMatrix.scale(0.1, 0.39, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //column front right
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0.4, 0.35, -0.2);
    modelMatrix.rotate(35, 1, 0 ,0);	//get column at an angle
    modelMatrix.rotate(17, 0, 0, 1);	//---
    modelMatrix.scale(0.1, 0.39, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //column back left
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(-0.4, 0.35, 0.6);
    modelMatrix.rotate(-20, 1, 0 ,0);	//get column at an angle
    modelMatrix.rotate(-10, 0, 0, 1);	//---
    modelMatrix.scale(0.1, 0.3, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //column back right
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0.4, 0.35, 0.6);
    modelMatrix.rotate(-20, 1, 0 ,0);	//get column at an angle
    modelMatrix.rotate(10, 0, 0, 1);	//---
    modelMatrix.scale(0.1, 0.3, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the wheels)
  var n = initVertexBuffers(gl, makeColor([1,1,1]));
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //spoiler strut left
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(-0.2, 0.35, 0.85);
    modelMatrix.scale(0.05, 0.3, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //spoiler strut right
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0.2, 0.35, 0.85);
    modelMatrix.scale(0.05, 0.3, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //spoiler
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);  // Translation
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0, 0.5, 0.85);
    modelMatrix.rotate(-5, 1, 0, 0);
    modelMatrix.scale(0.7, 0.01, 0.2); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Model the wheels
  //front left
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(-0.5, 0, -0.7);
    modelMatrix.rotate(w_turn, 1, 0, 0);
    modelMatrix.rotate(w_angle, 0, 1, 0);
    modelMatrix.scale(0.1, 0.3, 0.3);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n)
  modelMatrix = popMatrix();

  //front right
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0.5, 0, -0.7);
    modelMatrix.rotate(w_turn, 1, 0, 0);
    modelMatrix.rotate(w_angle, 0, 1, 0);
    modelMatrix.scale(0.1, 0.3, 0.3);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n)
  modelMatrix = popMatrix();

  //back left
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(-0.5, 0, 0.7);
    modelMatrix.rotate(w_turn, 1, 0, 0);
    modelMatrix.scale(0.1, 0.3, 0.3);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n)
  modelMatrix = popMatrix();

  //back right
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 0, 0);
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    modelMatrix.translate(0.5, 0, 0.7);
    modelMatrix.rotate(w_turn, 1, 0, 0);
    modelMatrix.scale(0.1, 0.3, 0.3);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n)
  modelMatrix = popMatrix();

  //set camera
  viewMatrix.setLookAt(g_xPosition, 5, g_zPosition+13, 0, 0, g_zPosition-10, 0, 1, 0);
  projMatrix.setPerspective(30, 1, 1, 100);
}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}

function randomColor(){
    temp = [];
    for(var i=0;i<72;i++){
      temp.push(getRandomBit());
    }
  /*
  var color = new Float32Array([    // Colors
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
  ]);
  */
  var color = new Float32Array(temp);
  return color;
}

function makeColor(chosenColor){
  color = []
  for(var i=0;i<24;i++){
    for(var j=0;j<3;j++){
      color.push(chosenColor[j])
    }
  }
  var color = new Float32Array(color);
  return color;
}

function getRandomBit(){
  return Math.floor(Math.random()*2);
}