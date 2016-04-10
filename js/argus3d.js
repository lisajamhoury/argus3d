window.addEventListener('load', init);

// scene 
var container, camera, scene, renderer, mesh; 

// intersection 
var raycaster, mouse, INTERSECTED,

  CANVAS_WIDTH,
  CANVAS_HEIGHT,

  CANVAS_OFFSETX,
  CANVAS_OFFSETY;


//rotation 
var targetRotationX = 0,
  targetRotationOnMouseDownX = 0,

  mouseX = 0,
  mouseXOnMouseDown = 0,

  mouseIsDown = false,
  touchIsDown = false,

  windowHalfX;

// video play 
var selectedEye;
var idleSince = Date.now();
var idling = false;
var IDLE_AFTER_MS = 5000;


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

  CANVAS_WIDTH = container.offsetWidth;
  CANVAS_HEIGHT = container.offsetHeight;
  console.log(CANVAS_WIDTH, CANVAS_HEIGHT);

  windowHalfX = CANVAS_WIDTH / 2;
  
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
  loader.load( 'obj/argus-aligned.obj', function ( object ) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = new THREE.MeshBasicMaterial( { color:0xedece8, wireframe: true, wireframeLinewidth: 1 } );
      }
    });
    
    var argus = object;
    group.add(argus);

  }, onProgress, onError );

  // internal solid argus 
  var argus2loader = new THREE.OBJLoader( manager );
  argus2loader.load( 'obj/argus-aligned2.obj', function ( object ) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = new THREE.MeshBasicMaterial( { color: 0x222222 } );
        child.scale.x = 0.99;
        child.scale.y = 0.99;
        child.scale.z = 0.99;   
      }
    } );

    var argus2 = object;
    group.add(argus2);

  }, onProgress, onError );    

  
  // load all eyes
  for (var i = 0; i < eyes.length; i++) {
    var currentEye = eyes[i]; 
    
    var eyeLoader = new THREE.OBJLoader( manager );
      eyeLoader.load( 'obj/eyes/' + eyes[i].filename, function ( object ) {
      var _currentEye = currentEye;
      object.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
          child.material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
          child.bodyposition = this.bodyposition;
        }
      }.bind(this) );
      
      var eye = object;
      group.add(eye);
      scene.add(group);
    }.bind(currentEye), onProgress, onError );

  }

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
  document.addEventListener( 'touchend', onDocumentTouchEnd, false );

  // window resize listener
  window.addEventListener( 'resize', onWindowResize, false );


} // closes init


function onWindowResize() {

  CANVAS_WIDTH = container.offsetWidth;
  CANVAS_HEIGHT = container.offsetHeight;
  
  windowHalfX = CANVAS_WIDTH / 2;

  camera.aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
  camera.updateProjectionMatrix();

  renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );

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


  if (INTERSECTED) videoPlay();

  idleSince = Date.now();
  if (idling) group.rotation.y = 0;
}

function onDocumentMouseMove( event ) {
    
  // intersection     
  setMousePosition(event.clientX, event.clientY);

  // model rotation 
  if (mouseIsDown === true ) {
    mouseX = event.clientX - windowHalfX;
    targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.02;
    console.log(targetRotationX);
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

  touchIsDown = true;
  console.log('touch', touchIsDown);

  idleSince = Date.now();
  if (idling) group.rotation.y = 0;
  // intersection     
  if ( event.touches.length == 1 ) {
    var touch = event.touches[ 0 ];
    setMousePosition(touch.clientX, touch.clientY);
  }

  if (INTERSECTED) videoPlay(); 

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
    targetRotationX = targetRotationOnMouseDownX + ( mouseX - mouseXOnMouseDown ) * 0.01;
  }

}

function onDocumentTouchEnd( event ) {
  touchIsDown = false;
  
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

function resetIntersected() {

  if (( selectedEye ) && (INTERSECTED == selectedEye)) {
      INTERSECTED = null;
      info.innerHTML = '';
  } else {
    if ( INTERSECTED ) INTERSECTED.material.color.setHex( 0x00ff00 );
    INTERSECTED = null;
    info.innerHTML = '';
  }
}

function videoPlay() {
  if (!selectedEye) {
    INTERSECTED.material.color.setHex(0xff0000);
    selectedEye = INTERSECTED;
    console.log('initial playing', selectedEye.bodyposition);


    // for (var j = 0; j < eyes.length; j++ ) {
    //   if (eyes[j].filename.indexOf(selectedEye.name) > -1 ) { 
    //     eyes[j].playing = true;
    //   }            
    // }
  }
  if (( selectedEye ) && (INTERSECTED != selectedEye)) {
    selectedEye.material.color.setHex(0x00ff00);
    INTERSECTED.material.color.setHex(0xff0000);
    // togglePlayStatus(selectedEye, INTERSECTED);
    selectedEye = INTERSECTED;
    console.log('playing', selectedEye.bodyposition);
  }
}

// function togglePlayStatus(oldSelection, newSelection) {
  
//   for (var j = 0; j < eyes.length; j++ ) {
//     if (eyes[j].filename.indexOf(oldSelection.name) > -1 ) { 
//       eyes[j].playing = false;
//     }            
//   }

//   for (var k = 0; k < eyes.length; k++ ) {
//     if (eyes[k].filename.indexOf(newSelection.name) > -1 ) { 
//       eyes[k].playing = true;
//     }            
//   }
// }

// render scene
function render() {
  var idleTime = Date.now() - idleSince;
  if (idleTime > IDLE_AFTER_MS) {
    idling = true;
    group.rotation.y += 0.01;
    mouse.x = 1;
    mouse.y = 1;
  } else {
    //horizontal rotation
    idling = false;
    var rotateBy = ( targetRotationX - group.rotation.y ) * 0.1;
    group.rotation.y += rotateBy;
  }

  // find intersections
  raycaster.setFromCamera( mouse, camera );
  
  // checks intersects for children of children    
  var intersects = raycaster.intersectObjects( scene.children, true );

  if ( intersects.length > 0 ) {

    if ( INTERSECTED != intersects[ 0 ].object ) {
      resetIntersected();
      
      // find eyes 
      if (intersects[ 0 ].object.name.indexOf('eye') > -1 ) { 
      
        //change color 
        INTERSECTED = intersects[ 0 ].object;
        if (touchIsDown) {
          videoPlay();
        } else {
          INTERSECTED.material.color.setHex( 0x006ebf ); 
        }
               
      }
    }

  } else {
    
    resetIntersected();
  }
  
  renderer.render( scene, camera );


}

(function animate() {

  requestAnimationFrame( animate );

  render();

})();

