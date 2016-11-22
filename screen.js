var NES = NES || { };

var palette = [
	[ 0x80, 0x80, 0x80 ],
	[ 0x00, 0x00, 0xBB ],
	[ 0x37, 0x00, 0xBF ],
	[ 0x84, 0x00, 0xA6 ],
	[ 0xBB, 0x00, 0x6A ],
	[ 0xB7, 0x00, 0x1E ],
	[ 0xB3, 0x00, 0x00 ],
	[ 0x91, 0x26, 0x00 ],
	[ 0x7B, 0x2B, 0x00 ],
	[ 0x00, 0x3E, 0x00 ],
	[ 0x00, 0x48, 0x0D ],
	[ 0x00, 0x3C, 0x22 ],
	[ 0x00, 0x2F, 0x66 ],
	[ 0x00, 0x00, 0x00 ],
	[ 0x05, 0x05, 0x05 ],
	[ 0x05, 0x05, 0x05 ],
	[ 0xC8, 0xC8, 0xC8 ],
	[ 0x00, 0x59, 0xFF ],
	[ 0x44, 0x3C, 0xFF ],
	[ 0xB7, 0x33, 0xCC ],
	[ 0xFF, 0x33, 0xAA ],
	[ 0xFF, 0x37, 0x5E ],
	[ 0xFF, 0x37, 0x1A ],
	[ 0xD5, 0x4B, 0x00 ],
	[ 0xC4, 0x62, 0x00 ],
	[ 0x3C, 0x7B, 0x00 ],
	[ 0x1E, 0x84, 0x15 ],
	[ 0x00, 0x95, 0x66 ],
	[ 0x00, 0x84, 0xC4 ],
	[ 0x11, 0x11, 0x11 ],
	[ 0x09, 0x09, 0x09 ],
	[ 0x09, 0x09, 0x09 ],
	[ 0xFF, 0xFF, 0xFF ],
	[ 0x00, 0x95, 0xFF ],
	[ 0x6F, 0x84, 0xFF ],
	[ 0xD5, 0x6F, 0xFF ],
	[ 0xFF, 0x77, 0xCC ],
	[ 0xFF, 0x6F, 0x99 ],
	[ 0xFF, 0x7B, 0x59 ],
	[ 0xFF, 0x91, 0x5F ],
	[ 0xFF, 0xA2, 0x33 ],
	[ 0xA6, 0xBF, 0x00 ],
	[ 0x51, 0xD9, 0x6A ],
	[ 0x4D, 0xD5, 0xAE ],
	[ 0x00, 0xD9, 0xFF ],
	[ 0x66, 0x66, 0x66 ],
	[ 0x0D, 0x0D, 0x0D ],
	[ 0x0D, 0x0D, 0x0D ],
	[ 0xFF, 0xFF, 0xFF ],
	[ 0x84, 0xBF, 0xFF ],
	[ 0xBB, 0xBB, 0xFF ],
	[ 0xD0, 0xBB, 0xFF ],
	[ 0xFF, 0xBF, 0xEA ],
	[ 0xFF, 0xBF, 0xCC ],
	[ 0xFF, 0xC4, 0xB7 ],
	[ 0xFF, 0xCC, 0xAE ],
	[ 0xFF, 0xD9, 0xA2 ],
	[ 0xCC, 0xE1, 0x99 ],
	[ 0xAE, 0xEE, 0xB7 ],
	[ 0xAA, 0xF7, 0xEE ],
	[ 0xB3, 0xEE, 0xFF ],
	[ 0xDD, 0xDD, 0xDD ],
	[ 0x11, 0x11, 0x11 ],
	[ 0x11, 0x11, 0x11 ]
];

var screenCanvas = document.getElementById('screen-canvas');
var screenContext = screenCanvas.getContext('2d');
var id = screenContext.createImageData(256, 240);

var selectedPixelX = 0;
var selectedPixelY = 0;

document.onkeydown = function(event) {
    // K, A
    if (event.keyCode == 75) {
        controller.setKeyDown(1);
    }

    // J, B
    if (event.keyCode == 74) {
        controller.setKeyDown(2);
    }

    // U, SELECT
    if (event.keyCode == 85) {
        controller.setKeyDown(3);
    }

    // I, START
    if (event.keyCode == 73) {
        controller.setKeyDown(4);
    }

    // W, UP
    if (event.keyCode == 87) {
        controller.setKeyDown(5);
    }

    // S, DOWN
    if (event.keyCode == 83) {
        controller.setKeyDown(6);
    }

    // A, LEFT
    if (event.keyCode == 65) {
        controller.setKeyDown(7);
    }

    // D, RIGHT
    if (event.keyCode == 68) {
        controller.setKeyDown(8);
    }

    // Up
    if (event.keyCode == 38) {
        selectedPixelY -= 1; 
        //console.log(selectedPixelX + ', ' + selectedPixelY);
    }

    // Left
    if (event.keyCode == 37) {
        selectedPixelX -= 1; 
        //console.log(selectedPixelX + ', ' + selectedPixelY);
    }

    // Right
    if (event.keyCode == 39) {
        selectedPixelX += 1; 
        //console.log(selectedPixelX + ', ' + selectedPixelY);
    }

    // Down
    if (event.keyCode == 40) {
        selectedPixelY += 1; 
        //console.log(selectedPixelX + ', ' + selectedPixelY);
    }
};

document.onkeyup = function(event) {
    // K, A
    if (event.keyCode == 75) {
        controller.setKeyUp(1);
    }

    // J, B
    if (event.keyCode == 74) {
        controller.setKeyUp(2);
    }

    // U, SELECT
    if (event.keyCode == 85) {
        controller.setKeyUp(3);
    }

    // I, START
    if (event.keyCode == 73) {
        controller.setKeyUp(4);
    }

    // W, UP
    if (event.keyCode == 87) {
        controller.setKeyUp(5);
    }

    // S, DOWN
    if (event.keyCode == 83) {
        controller.setKeyUp(6);
    }

    // A, LEFT
    if (event.keyCode == 65) {
        controller.setKeyUp(7);
    }

    // D, RIGHT
    if (event.keyCode == 68) {
        controller.setKeyUp(8);
    }
};

screenCanvas.style.backgroundColor = 'rgb(' + 0 + ',' + 0 + ',' + 0 + ')';

var updateScreen = function() {
    var idx = ppu.readByte(0x3F00);
    var color = palette[idx];

    screenCanvas.style.backgroundColor = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';

    /*
    id.data[4 * (256 * selectedPixelY + selectedPixelX) + 0] = 256;
    id.data[4 * (256 * selectedPixelY + selectedPixelX) + 1] = 256;
    id.data[4 * (256 * selectedPixelY + selectedPixelX) + 2] = 256;
    id.data[4 * (256 * selectedPixelY + selectedPixelX) + 3] = 256;
    */

    screenContext.putImageData(id, 0, 0);

    for (var x = 0; x < 256; x++) {
        for (var y = 0; y < 240; y++) {
            id.data[4 * (256 * y + x) + 0] = 0;
            id.data[4 * (256 * y + x) + 1] = 0;
            id.data[4 * (256 * y + x) + 2] = 0;
            id.data[4 * (256 * y + x) + 3] = 0;
        }
    }
};

var screenSetPixel = function(x, y, c) {
    id.data[4 * (256 * y + x) + 0] = palette[c][0];
    id.data[4 * (256 * y + x) + 1] = palette[c][1];
    id.data[4 * (256 * y + x) + 2] = palette[c][2];
    id.data[4 * (256 * y + x) + 3] = 256;
};
