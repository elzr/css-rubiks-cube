/*
corners  _.-'-._                 edges    _.-'-._
     _.-'-._3_.-'-._                  _.-'-._ _.-'-._
 _.-'-._ _.-'-._ _.-'-._          _.-'-._1_.-'-._3_.-'-._
|-._ _.-'-._U_.-'-._ _.-|        |-._ _.-'-._U_.-'-._ _.-|
| 1 |-._ _.-'-._ _.-| 2 |        |   |-._ _.-'-._ _.-|   |
|-._|   |-._ _.-|   |_.-|        |-._| 0 |-._ _.-| 2 |_.-|
|   |-._|   0   |_.-|   |        | 9 |-._|   |   |_.-| 10|
|-._| F |-._|_.-| R |_.-|        |-._| F |-._|_.-| R |_.-|
| 5 |-._|   |   |_.-| 6 |   5--> |   |-._|  8|   |_.-|   | <--7
'-._|   |-._|_.-|   |_.-'        '-._| 4 |-._|_.-| 6 |_.-'
    '-._|   |   |_.-'                '-._|   |   |_.-'
        '-._4_.-'                        '-._|_.-'

U       F        R       L       B       D
up    front    right    left    back    down
*/

var layers = {
	u: {corners: [0, 1, 3, 2], edges: [0, 1, 3, 2]},
	f: {corners: [1, 0, 4, 5], edges: [0, 8, 4, 9]},
	r: {corners: [0, 2, 6, 4], edges: [6, 8, 2, 10]},
	l: {corners: [3, 1, 5, 7], edges: [1, 9, 5, 11]},
	b: {corners: [2, 3, 7, 6], edges: [3, 11, 7, 10]},
	d: {corners: [4, 6, 7, 5], edges: [4, 6, 7, 5]}
};


/** Adds classes to cubies to start animation. */
function move(turn) { // turn examples: 'r1', 'd2', 'u3'
	var side = turn[0];
	var layer = layers[side];
	var m = document.querySelector('.cubie-middle-' + side);
	var cubies = [m.parentNode];
	for(var i=0; i<layer.corners.length; ++i) {
		var c = document.querySelector('.cubie-corner-position-' + layer.corners[i]);
		cubies.push(c.parentNode);
	}
	for(var i=0; i<layer.edges.length; ++i) {
		var e = document.querySelector('.cubie-edge-position-' + layer.edges[i]);
		cubies.push(e.parentNode);
	}
	for(var i=0; i<cubies.length; ++i) {
		cubies[i].classList.add('turn');
		cubies[i].classList.add('turn-' + turn);
	}
}


/**	Updates classes of cubie. This should be called on completion of
	animation for every cubie that was involved in animation. */
function updateCubie() {
	var match = this.className.match(/turn\-(..)/);
	this.classList.remove('turn');
	this.classList.remove(match[0]);
	
	var step = +match[1][1];
	var side = match[1][0];
	var layer = layers[side];
	var div = this.children[0];
	
	var re = /(cubie-corner-position-)(\d+)/;
	if(match = div.className.match(re)) {
		var idx = layer.corners.indexOf(+match[2]);
		var newVal = layer.corners[(idx + step)&3];
		div.className = div.className.replace(re, '$1' + newVal);
		
		div = div.children[0];
		re = /(cubie-corner-orientation-)(\d+)/;
		match = div.className.match(re);
		newVal = (+match[2] + (side!='u' && side!='d') * (step&1) * (1+(idx&1))) % 3;
		div.className = div.className.replace(re, '$1' + newVal);
	}
	
	re = /(cubie-edge-position-)(\d+)/;
	if(match = div.className.match(re)) {
		var idx = layer.edges.indexOf(+match[2]);
		var newVal = layer.edges[(idx + step)&3];
		div.className = div.className.replace(re, '$1' + newVal);
		
		div = div.children[0];
		re = /(cubie-edge-orientation-)(\d+)/;
		match = div.className.match(re);
		newVal = +match[2]^(side=='f' || side=='b')&step;
		div.className = div.className.replace(re, '$1' + newVal);
	}
}

let isRotating = true;
let moveInterval = null;
// dragging variables
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};
let cubeRotation = {
    x: -20,  // Initial rotation values from cube.css
    y: -30,
    z: 9
};

/**	Generates and executes random move */
var nextMove = function() {
	var prevSide = '';
	var sides = ['u','f','r','l','b','d'];
	return function() {
    // Only generate next move if we're not paused and no moves are in progress
    
    if (!isRotating || document.querySelector('.cube-layer.turn')) return;

    console.log('wtf', isRotating);
      
		var side = prevSide;
		while(side == prevSide) side = sides[Math.random()*6|0];
		var step = 1 + (Math.random()*3|0);
		setTimeout(function() {move(side+step)}, 10);
		prevSide = side;

    // Schedule next move
    moveInterval = setTimeout(nextMove, 1000);
	};
}();


(function() {
	// add `transitionend` listeners for updating classes and starting next move
	var layerDivs = document.querySelectorAll('.cube-layer');
	for(var i=0; i<layerDivs.length; ++i) {
		layerDivs[i].addEventListener('transitionend', updateCubie, true);
		layerDivs[i].addEventListener('transitionend', nextMove, true);
	}
})();


// start the first move
nextMove();


/** Controls cube rotation and random moves */
function toggleRotation() {
  const cube = document.querySelector('.cube');
  isRotating = !isRotating;
  
  if (!isRotating) {
      // If we're stopping automatic rotation, ensure we maintain the current rotation
      const computedStyle = window.getComputedStyle(cube);
      const matrix = new DOMMatrix(computedStyle.transform);
      
      // Extract rotation angles from the matrix
      cubeRotation.y = Math.atan2(matrix.m13, matrix.m11) * (180/Math.PI);
      cubeRotation.x = Math.atan2(-matrix.m23, matrix.m22) * (180/Math.PI);
      
      cube.style.animation = 'none';
      cube.style.transform = `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg) rotateZ(${cubeRotation.z}deg)`;
      cube.classList.add('paused');
      clearInterval(moveInterval);
  } else {
      cube.style.animation = 'rotate 120s infinite linear';
      cube.style.transform = '';
      cube.classList.remove('paused');
      if (!document.querySelector('.cube-layer.turn')) {
          nextMove();
      }
  }
}

// Add keyboard control - spacebar to toggle rotation
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
      event.preventDefault(); // Prevent page scrolling
      toggleRotation();
  }
});

toggleRotation(); // start with animations paused

/** Handles start of drag */
function handleDragStart(e) {
    isDragging = true;
    
    // Handle both mouse and touch events
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    previousMousePosition = {
        x: clientX,
        y: clientY
    };
    
    // If cube is currently auto-rotating, stop it
    if (isRotating) {
        toggleRotation();
    }
}

/** Handles drag movement */
function handleDragMove(e) {
    if (!isDragging) return;
    
    // Prevent default behaviors like text selection
    e.preventDefault();
    
    // Handle both mouse and touch events
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    // Calculate how far the mouse has moved
    const deltaX = clientX - previousMousePosition.x;
    const deltaY = clientY - previousMousePosition.y;
    
    // Update the cube rotation
    // Reversed deltaX because we want clockwise rotation when dragging right
    cubeRotation.y += deltaX * 0.5;  // Horizontal movement -> Y rotation
    cubeRotation.x += deltaY * 0.5;  // Vertical movement -> X rotation
    
    // Apply the new rotation to the cube
    const cube = document.querySelector('.cube');
    cube.style.transform = `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg) rotateZ(${cubeRotation.z}deg)`;
    
    // Save the current mouse position for next time
    previousMousePosition = {
        x: clientX,
        y: clientY
    };
}

/** Handles end of drag */
function handleDragEnd() {
    isDragging = false;
}

// Add event listeners
const scene = document.querySelector('.scene');

// Mouse events
scene.addEventListener('mousedown', handleDragStart);
document.addEventListener('mousemove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);

// Touch events
scene.addEventListener('touchstart', handleDragStart, { passive: false });
document.addEventListener('touchmove', handleDragMove, { passive: false });
document.addEventListener('touchend', handleDragEnd);