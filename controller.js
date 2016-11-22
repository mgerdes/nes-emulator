var NES = NES || { };

NES.Controller = function() {
    var state = new Uint8Array(9); 
    var prevWrite = 0;
    var p = 10;

    state[0] = 1;

    this.setKeyDown = function(keyNum) {
        state[keyNum] = 1;
    };

    this.setKeyUp = function(keyNum) {
        state[keyNum] = 0;
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
