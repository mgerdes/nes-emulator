var NES = NES || { };

NES.Mapper4 = function(prgData, chrData) {
    var me = this;

    var bankSelect = 0;
    var bankData = new Array(8);
    var prgMode = 0;
    var chrMode = 0;

    var irqCounter = 0;
    var irqReload = 0;
    var irqEnable = true;

    var SRAM = new Uint8Array(0x2000);

    this.mirror = 0;

    this.handleScanline = function() {
        if (irqCounter == 0) {
            irqCounter = irqReload;
        }
        else {
            irqCounter -= 1;
            if (irqCounter == 0 && irqEnable) {
                cpu.irqInterrupt();
            }
        }
    };

    var UTEMP = new Uint8Array(1);
    var countyDounty = 0;

    this.writeByte = function(address, value) {
        UTEMP[0] = value;

        if (address < 0x2000) {
            if (address < 0x0400) {
                if (chrMode == 0) {
                    chrData[(bankData[0] << 10) + (address % 0x0400)] = value;
                }
                else {
                    chrData[(bankData[2] << 10) + (address % 0x0400)] = value;
                }
            }
            else if (address < 0x0800) {
                if (chrMode == 0) {
                    chrData[(bankData[0] << 10) + 0x0400 + (address % 0x0400)] = value;
                }
                else {
                    chrData[(bankData[3] << 10) + (address % 0x0400)] = value;
                }
            }
            else if (address < 0x0C00) {
                if (chrMode == 0) {
                    chrData[(bankData[1] << 10) + (address % 0x0400)] = value;
                }
                else {
                    chrData[(bankData[4] << 10) + (address % 0x0400)] = value;
                }
            }
            else if (address < 0x1000) {
                if (chrMode == 0) {
                    chrData[(bankData[1] << 10) + 0x0400 + (address % 0x0400)] = value;
                }
                else {
                    chrData[(bankData[5] << 10) + (address % 0x0400)] = value;
                }
            }
            else if (address < 0x1400) {
                if (chrMode == 0) {
                    chrData[(bankData[2] << 10) + (address % 0x0400)] = value;
                }
                else {
                    chrData[(bankData[0] << 10) + (address % 0x0400)] = value;
                }
            }
            else if (address < 0x1800) {
                if (chrMode == 0) {
                    chrData[(bankData[3] << 10) + (address % 0x0400)] = value;
                }
                else {
                    chrData[(bankData[0] << 10) + 0x0400 + (address % 0x0400)] = value;
                }
            }
            else if (address < 0x1C00) {
                if (chrMode == 0) {
                    chrData[(bankData[4] << 10) + (address % 0x0400)] = value;
                }
                else {
                    chrData[(bankData[1] << 10) + (address % 0x0400)] = value;
                }
            }
            else {
                if (chrMode == 0) {
                    chrData[(bankData[5] << 10) + (address % 0x0400)] = value;
                }
                else {
                    chrData[(bankData[1] << 10) + 0x0400 + (address % 0x0400)] = value;
                }
            }
        }
        else if (address >= 0x6000 && address < 0x8000) {
            SRAM[address - 0x6000] = value;
        }
        else if (address < 0x10000) {
            if ((address < 0xA000) && ((address & 0x1) == 0)) {
                // Bank Select 
                bankSelect = UTEMP[0] & 0x7;
                prgMode = (UTEMP[0] >> 6) & 0x1;
                chrMode = (UTEMP[0] >> 7) & 0x1;
            }
            else if ((address < 0xA000) && ((address & 0x1) == 1)) {
                // Bank Data 
                bankData[bankSelect] = UTEMP[0];
            }
            else if ((address < 0xC000) && ((address & 0x1) == 0)) {
                // Mirroring 
                me.mirror = UTEMP[0] & 0x1;
                console.log('mirror - ' + me.mirror);
            }
            else if ((address < 0xC000) && ((address & 0x1) == 1)) {
                // RAM Protect 
            }
            else if ((address < 0xE000) && ((address & 0x1) == 0)) {
                // IRQ Latch
                irqReload = UTEMP[0];  
            }
            else if ((address < 0xE000) && ((address & 0x1) == 1)) {
                // IRQ Reload
                irqCounter = 0;
            }
            else if ((address & 0x1) == 0) {
                // IRQ Disable
                irqEnable = false;
            }
            else if ((address & 0x1) == 1) {
                // IRQ Enable
                irqEnable = true;
            }
        }
        else {
            throw('Invalid write address to mapper1 - ' + address.toString(16));
        }
    };

    this.readByte = function(address) {
        if (address < 0x2000) {
            if (address < 0x0400) {
                if (chrMode == 0) {
                    return chrData[(bankData[0] << 10) + (address % 0x0400)];
                }
                else {
                    return chrData[(bankData[2] << 10) + (address % 0x0400)];
                }
            }
            else if (address < 0x0800) {
                if (chrMode == 0) {
                    return chrData[(bankData[0] << 10) + 0x0400 + (address % 0x0400)];
                }
                else {
                    return chrData[(bankData[3] << 10) + (address % 0x0400)];
                }
            }
            else if (address < 0x0C00) {
                if (chrMode == 0) {
                    return chrData[(bankData[1] << 10) + (address % 0x0400)];
                }
                else {
                    return chrData[(bankData[4] << 10) + (address % 0x0400)];
                }
            }
            else if (address < 0x1000) {
                if (chrMode == 0) {
                    return chrData[(bankData[1] << 10) + 0x0400 + (address % 0x0400)];
                }
                else {
                    return chrData[(bankData[5] << 10) + (address % 0x0400)];
                }
            }
            else if (address < 0x1400) {
                if (chrMode == 0) {
                    return chrData[(bankData[2] << 10) + (address % 0x0400)];
                }
                else {
                    return chrData[(bankData[0] << 10) + (address % 0x0400)];
                }
            }
            else if (address < 0x1800) {
                if (chrMode == 0) {
                    return chrData[(bankData[3] << 10) + (address % 0x0400)];
                }
                else {
                    return chrData[(bankData[0] << 10) + 0x0400 + (address % 0x0400)];
                }
            }
            else if (address < 0x1C00) {
                if (chrMode == 0) {
                    return chrData[(bankData[4] << 10) + (address % 0x0400)];
                }
                else {
                    return chrData[(bankData[1] << 10) + (address % 0x0400)];
                }
            }
            else {
                if (chrMode == 0) {
                    return chrData[(bankData[5] << 10) + (address % 0x0400)];
                }
                else {
                    return chrData[(bankData[1] << 10) + 0x0400 + (address % 0x0400)];
                }
            }
        }
        else if (address >= 0x6000 && address < 0x8000) {
            return SRAM[address - 0x6000];
        }
        else if (address < 0x10000) {
            if (address < 0xA000) {
                if (prgMode == 0) {
                    return prgData[(bankData[6] << 13) + (address % 0x2000)];
                }
                else {
                    return prgData[(((prgData.length >> 13) - 2) << 13) + (address % 0x2000)];
                }
            }
            else if (address < 0xC000) {
                if (prgMode == 0) {
                    return prgData[(bankData[7] << 13) + (address % 0x2000)];
                }
                else {
                    return prgData[(bankData[7] << 13) + (address % 0x2000)];
                }
            }
            else if (address < 0xE000) {
                if (prgMode == 0) {
                    return prgData[(((prgData.length >> 13) - 2) << 13) + (address % 0x2000)];
                }
                else {
                    return prgData[(bankData[6] << 13) + (address % 0x2000)];
                }
            }
            else {
                if (prgMode == 0) {
                    return prgData[(((prgData.length >> 13) - 1) << 13) + (address % 0x2000)];
                }
                else {
                    return prgData[(((prgData.length >> 13) - 1) << 13) + (address % 0x2000)];
                }
            }
        }
        else {
            throw('Invalid read address to mapper1 - ' + address.toString(16));
        }
    };
};
