window.addEventListener('load', init);

// scene 
var container, camera, scene, renderer, mesh; 

// intersection 
var raycaster, mouse, INTERSECTED,

  CANVAS_WIDTH = 205,
  CANVAS_HEIGHT = 430,

  CANVAS_OFFSETX,
  CANVAS_OFFSETY;


//rotation 
var targetRotationX = 0,
  targetRotationOnMouseDownX = 0,

  mouseX = 0,
  mouseXOnMouseDown = 0,

  mouseIsDown = false,

  windowHalfX = CANVAS_WIDTH / 2;

function init () {    
  // info
  info = document.createElement( 'div' );
  info.style.position = 'absolute';
  info.style.top = '30px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.style.color = '#000';
  info.style.backgroundColor = 'transparent';
  info.style.zIndex = '1';
  info.style.fontFamily = 'Monospace';
  info.style.fontSize = '20px';
  info.style.userSelect = 'none';
  info.style.webkitUserSelect = 'none';
  info.style.MozUserSelect = 'none';
  info.innerHTML = '';
  document.body.appendChild( info );

  // container for 3d model
  container = document.getElementById( 'canvas' );
  
  // normalize mouse 
  CANVAS_OFFSETX = container.offsetLeft;
  CANVAS_OFFSETY = container.offsetTop;

  // scene, raycaster, camera
  scene = new THREE.Scene();

  raycaster = new THREE.Raycaster();

  camera = new THREE.PerspectiveCamera( 75, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 1000 );
  camera.position.y = 0;
  camera.position.z = 35;
  camera.lookAt( scene.position );

  // obj loader 
  var manager = new THREE.LoadingManager();
    manager.onProgress = function ( item, loaded, total ) {
      // console.log( item, loaded, total );

  };

  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      //console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
  };

  var onError = function ( xhr ) {
  };

  // to hold all model meshes
  group = new THREE.Object3D();
   
  // wireframe argus  
  var loader = new THREE.OBJLoader( manager );
  loader.load( 'obj/argus.obj', function ( object ) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = new THREE.MeshBasicMaterial( { color:0xedece8, wireframe: true, wireframeLinewidth: 0.5 } );
      }
    });
    
    var argus = object;
    argus.position.y = 8;
    group.add(argus);

  }, onProgress, onError );

  // internal solid argus 
  var argus2loader = new THREE.OBJLoader( manager );
  argus2loader.load( 'obj/argus2.obj', function ( object ) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = new THREE.MeshBasicMaterial( { color: 0x222222 } );
        child.scale.x = 0.99;
        child.scale.y = 0.99;
        child.scale.z = 0.99;   
      }
    } );

    var argus2 = object;
    argus2.position.y = 8;
    group.add(argus2);

  }, onProgress, onError );    

  // eyes -- to be replaced 
  var eyeLoader = new THREE.OBJLoader( manager );
  eyeLoader.load( 'obj/eyes.obj', function ( object ) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        child.scale.x = 1.1;
        child.scale.y = 1.1;
        child.scale.z = 1.1;
      }
    } );
    
    var eyes = object;
    eyes.position.y = 3;
    eyes.position.z = 0.5;
    group.add(eyes);
    scene.add(group);
  }, onProgress, onError );

  // mouse for intersection detection
  mouse = new THREE.Vector2();

  // initializing mouse off center
  mouse.x = 1;
  mouse.y = 1;

  // threejs renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.sortObjects = false;
  container.appendChild( renderer.domElement );
  
  // mouse and touch listeners
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'touchstart', onDocumentTouchStart, false );
  document.addEventListener( 'touchmove', onDocumentTouchMove, false );

  // window resize listener
  window.addEventListener( 'resize', onWindowResize, false );


} // closes init


function onWindowResize() {

  // camera.aspect = window.innerWidth / window.innerHeight;
  // camera.updateProjectionMatrix();

  // renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseDown( event ) {

  event.preventDefault();

  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  document.addEventListener( 'mouseout', onDocumentMouseOut, false );

  //model rotation 
  mouseIsDown = true;
  mouseXOnMouseDown = event.clientX - windowHalfX;
  targetRotationOnMouseDownX = targetRotationX;

}

function onDocumentMouseMove( event ) {
    
  // intersection     
  setMousePosition(event.clientX, event.clientY);

  // model rotation 
  if (mouseIsDown === true ) {
    mouseX = event.clientX - windowHalfX;
    targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.02;
  }

}

function onDocumentMouseUp( event ) {

  document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  document.removeEventListener( 'mouseout', onDocumentMouseOut, false );

  // model rotation 
  mouseIsDown = false;

}

function onDocumentMouseOut( event ) {

  document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
  
  // model rotation 
  mouseIsDown = false;

}

function onDocumentTouchStart( event ) {


  // intersection     
  if ( event.touches.length == 1 ) {
    var touch = event.touches[ 0 ];
    setMousePosition(touch.clientX, touch.clientY);
  }


  //model rotation 
  if ( event.touches.length == 1 ) {

    event.preventDefault();

    mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
    targetRotationOnMouseDownX = targetRotationX;
  }

}

function onDocumentTouchMove( event ) {

  //model rotation
  if ( event.touches.length == 1 ) {

    event.preventDefault();

    mouseX = event.touches[ 0 ].pageX - windowHalfX;
    targetRotationX = targetRotationOnMouseDownX + ( mouseX - mouseXOnMouseDown ) * 0.05;
  }

}

// normalize mouse position for intersection
function setMousePosition(clientX, clientY) {
  if (isOnCanvas( clientX, clientY )) {
    var normalizedX = clientX - CANVAS_OFFSETX;
    var normalizedY = clientY - CANVAS_OFFSETY;
    mouse.x = ( normalizedX / CANVAS_WIDTH ) * 2 - 1;
    mouse.y = - ( normalizedY / CANVAS_HEIGHT ) * 2 + 1;
  }
}

// detect if on canvas
function isOnCanvas( clientX, clientY) {
  
  if ((clientX > CANVAS_OFFSETX && clientX < (CANVAS_OFFSETX + CANVAS_WIDTH)) &&
    (clientY > CANVAS_OFFSETY && clientY < (CANVAS_OFFSETY + CANVAS_HEIGHT))) {
    return true;
  }
}

// render scene
function render() {
  
  //horizontal rotation   
  group.rotation.y += ( targetRotationX - group.rotation.y ) * 0.1;
  
  // find intersections
  raycaster.setFromCamera( mouse, camera );
  
  // checks intersects for children of children    
  var intersects = raycaster.intersectObjects( scene.children, true );

  if ( intersects.length > 0 ) {
  
    if ( INTERSECTED != intersects[ 0 ].object ) {
      
      // find eyes 
      if (intersects[ 0 ].object.name == 'eyes') { 
      
        //change color 
        INTERSECTED = intersects[ 0 ].object;
        INTERSECTED.material.color.setHex( 0x006ebf ); 

        // log contact 
        info.innerHTML = 'contact';
      }
    }

  } else {
    
    // return color of intersected
    if ( INTERSECTED ) INTERSECTED.material.color.setHex( 0xffffff );

    // reset intersected
    INTERSECTED = null;
    info.innerHTML = '';

  }
  
  renderer.render( scene, camera );

}

(function animate() {

  requestAnimationFrame( animate );

  render();

})();

