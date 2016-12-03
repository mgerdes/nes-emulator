var NES = NES || { };

NES.Mapper1 = function(prgData, chrData) {
    var me = this;

    var bankData = new Array(3);

    var shiftRegister = 0;
    var numWrites = 0;

    /*
     * PRG Mode:
     * 0, 1: switch 32 KB at $8000, ignoring low bit of bank number
     * 2: fix first bank at $8000 and switch 16 KB bank at $C000
     * 3: fix last bank at $C000 and switch 16 KB bank at $8000
     */
    var prgMode = 3;

    /*
     * CHR Mode:
     * 0: switch 8 KB at a time
     * 1: switch two separate 4 KB banks
     */
    var chrMode = 1;

    var SRAM = new Uint8Array(0x2000);

    this.mirror = 1;

    var UTEMP = new Uint8Array(1);

    this.readByte = function(address) {
        if (address < 0x1000) {
            if (chrMode == 0) {
                return chrData[((bankData[0] & 0xFE) << 12) + (address % 0x1000)];
            }
            else {
                return chrData[(bankData[0] << 12) + (address % 0x1000)];
            }
        }
        else if (address < 0x2000) {
            if (chrMode == 0) {
                return chrData[((bankData[0] & 0xFE) << 12) + 0x1000 + (address % 0x1000)];
            }
            else {
                return chrData[(bankData[1] << 12) + (address % 0x1000)];
            }
        }
        else if ((address >= 0x6000) && (address < 0x8000)) {
            return SRAM[address - 0x6000];
        }
        else if ((address >= 0x8000) && (address < 0xC000)) {
            if (prgMode == 0 || prgMode == 1) {
                return prgData[((bankData[2] & 0xFE) << 14) + (address % 0x4000)];
            }
            else if (prgMode == 2) {
                return prgData[address % 0x4000];
            }
            else if (prgMode == 3) {
                return prgData[(bankData[2] << 14) + (address % 0x4000)];
            }
        }
        else if ((address >= 0xC000) && (address < 0x10000)) {
            if (prgMode == 0 || prgMode == 1) {
                return prgData[((bankData[2] & 0xFE) << 14) + 0x4000 + (address % 0x4000)];
            }
            else if (prgMode == 2) {
                return prgData[(bankData[2] << 14) + (address % 0x4000)];
            }
            else if (prgMode == 3) {
                return prgData[(((prgData.length >> 14) - 1) << 14) + (address % 0x4000)];
            }
        }
        else {
            throw('Invalid read address to mapper1 - ' + address.toString(16));
        }
    };

    this.writeByte = function(address, value) {
        UTEMP[0] = value;

        if (address < 0x1000) {
            if (chrMode == 0) {
                chrData[((bankData[0] & 0xFE) << 12) + (address % 0x1000)] = value;
            }
            else {
                chrData[(bankData[0] << 12) + (address % 0x1000)] = value;
            }
        }
        else if (address < 0x2000) {
            if (chrMode == 0) {
                chrData[((bankData[0] & 0xFE) << 12) + 0x1000 + (address % 0x1000)] = value;
            }
            else {
                chrData[(bankData[1] << 12) + (address % 0x1000)] = value;
            }
        }
        else if (address >= 0x6000 && address < 0x8000) {
            SRAM[address - 0x6000] = value;
        }
        else if (address >= 0x8000 && address < 0x10000) {
            if (testBit(UTEMP[0], 7)) {
                shiftRegister = 0;
                numWrites = 0;

                me.mirror = ppu.Mirror.Single0;
                prgMode = 3;
                chrMode = 0;
            }
            else {
                shiftRegister = shiftRegister >> 1; 
                shiftRegister = setBit(shiftRegister, 4, testBit(UTEMP[0], 0));
                numWrites += 1;

                if (numWrites == 5) {
                    if (address < 0xA000) {
                        if ((shiftRegister & 0x3) == 0) {
                            me.mirror = ppu.Mirror.Single0;
                        }
                        else if ((shiftRegister & 0x3) == 1) {
                            me.mirror = ppu.Mirror.Single1;
                        }
                        else if ((shiftRegister & 0x3) == 2) {
                            me.mirror = ppu.Mirror.Vertical;
                        }
                        else if ((shiftRegister & 0x3) == 3) {
                            me.mirror = ppu.Mirror.Horizontal;
                        }
                        prgMode = ((shiftRegister >> 2) & 0x3);
                        chrMode = ((shiftRegister >> 4) & 0x1);
                    }
                    else if (address < 0xC000) {
                        bankData[0] = shiftRegister;
                    }
                    else if (address < 0xE000) {
                        bankData[1] = shiftRegister;
                    }
                    else {
                        bankData[2] = (shiftRegister & 0xF); 
                    }

                    shiftRegister = 0;
                    numWrites = 0;
                }
            }
        }
        else {
            throw('Invalid write address to mapper1 - ' + address.toString(16));
        }

    };
};

