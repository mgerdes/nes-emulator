var NES = NES || { };

NES.Mapper0 = function(prgData, chrData) {
    var me = this;    

    this.mirror = ppu.Mirror.Horizontal;

    this.writeByte = function(address, value) {
        if (address < 0x2000) {
            chrData[address] = value;
        }
        else if (address >= 0x6000 && address < 0x8000) {

        }
        else if (address < 0x10000) {
            if ((prgData.length >> 14) == 1) {
                prgData[address % 0x4000] = value;
            }
            else {
                prgData[address % 0x8000] = value;
            }
        }
        else {
            throw('Invalid write address to mapper0 - ' + address.toString(16));
        }
    };

    this.readByte = function(address) {
        if (address < 0x2000) {
            return chrData[address];
        }
        else if (address >= 0x6000 && address < 0x8000) {

        }
        else if (address < 0x10000) {
            if ((prgData.length >> 14) == 1) {
                return prgData[address % 0x4000];
            }
            else {
                return prgData[address % 0x8000];
            }
        }
        else {
            throw('Invalid read address to mapper0 - ' + address.toString(16));
        }
    };
};

