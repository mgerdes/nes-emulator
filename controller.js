var NES = NES || { };

NES.Controller = function() {
    var state = new Uint8Array(9); 
    var prevWrite = 0;
    var p = 10;

    state[0] = 1;

    document.onkeydown = function(event) {
        // K, A
        if (event.keyCode == 75) {
            state[1] = 1;
        }

        // J, B
        if (event.keyCode == 74) {
            state[2] = 1;
        }

        // U, SELECT
        if (event.keyCode == 85) {
            state[3] = 1;
        }

        // I, START
        if (event.keyCode == 73) {
            state[4] = 1;
        }

        // W, UP
        if (event.keyCode == 87) {
            state[5] = 1;
        }

        // S, DOWN
        if (event.keyCode == 83) {
            state[6] = 1;
        }

        // A, LEFT
        if (event.keyCode == 65) {
            state[7] = 1;
        }

        // D, RIGHT
        if (event.keyCode == 68) {
            state[8] = 1;
        }
    };

    document.onkeyup = function(event) {
        // K, A
        if (event.keyCode == 75) {
            state[1] = 0;
        }

        // J, B
        if (event.keyCode == 74) {
            state[2] = 0;
        }

        // U, SELECT
        if (event.keyCode == 85) {
            state[3] = 0;
        }

        // I, START
        if (event.keyCode == 73) {
            state[4] = 0;
        }

        // W, UP
        if (event.keyCode == 87) {
            state[5] = 0;
        }

        // S, DOWN
        if (event.keyCode == 83) {
            state[6] = 0;
        }

        // A, LEFT
        if (event.keyCode == 65) {
            state[7] = 0;
        }

        // D, RIGHT
        if (event.keyCode == 68) {
            state[8] = 0;
        }
    };

    this.readIO = function(address) {
        if (address == 0x4016) {
            if (p++ < 8) {
                return state[p];
            }
        }

        return 0;
    };

    this.writeIO = function(address, value) {
        if (address == 0x4016) {
            if ((value & 1) == 0 && prevWrite == 1) {
                p = 0;
            }
        }

        prevWrite = value & 1;
    };
};
