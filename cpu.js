var NES = NES || { };

NES.CPU = function() {
    var me = this;

    var C_FLAG = 0;
    var Z_FLAG = 1;
    var I_FLAG = 2;
    var D_FLAG = 3;
    var B_FLAG = 4;
    var V_FLAG = 6;
    var N_FLAG = 7;

    var P = new Uint8Array(1);
    var PC = new Uint16Array(1);
    var SP = new Uint8Array(1);
    var A = new Int8Array(1);
    var X = new Uint8Array(1);
    var TEMP = new Int8Array(1);

    P[0] = 0x24;
    PC[0] = 0x0;
    SP[0] = 0x0;
    A[0] = 0x0;
    X[0] = 0x0;

    var memory = new Uint8Array(0x10000);

    this.run = function(cycles) {
        var count = 0;

        while (cycles > 0) {
            var opCode = me.readByte(PC[0]);

            //console.log('\ncount: ' + count++);
            //console.log('opcode: ' + opCode.toString(16));
            //console.log('flags: ' + P[0].toString(16));
            //console.log('pc: ' + PC[0].toString(16));
            //console.log('cycles: ' + cycles);

            switch (opCode) {
                // JMP Absolute
                case 0x4C:
                    PC[0] = me.readWord(PC[0] + 1);
                    cycles -= 3;
                    break;

                // SEI Disable
                case 0x78:
                    P[0] = setBit(P[0], I_FLAG, true);

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // CLD Mode
                case 0xD8:
                    P[0] = setBit(P[0], D_FLAG, false);

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // LDA Immediate
                case 0xA9:
                    A[0] = me.readByte(PC[0] + 1);
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // LDA Absolute
                case 0xAD:
                    A[0] = me.readByte(me.readWord(PC[0] + 1));
                    P[0] = setBit(P[0], Z_FLAG, A[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(A[0], 7));

                    PC[0] += 3;
                    cycles -= 4;
                    break;

                // STA Absolute
                case 0x8D:
                    me.writeByte(me.readWord(PC[0] + 1), A);

                    PC[0] += 3;
                    cycles -= 4;
                    break;

                // LDX Immediate
                case 0xA2:
                    X[0] = me.readByte(PC[0] + 1);
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 2;
                    cycles -= 2;
                    break;

                // BPL Relative
                case 0x10:
                    if (testBit(P[0], N_FLAG)) {
                        PC[0] += 2;
                        cycles -= 2;
                    }
                    else {
                        TEMP[0] = me.readByte(PC[0] + 1);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }
                    break;

                // DEX Implied
                case 0xCA:
                    X[0] -= 1;
                    P[0] = setBit(P[0], Z_FLAG, X[0] == 0);
                    P[0] = setBit(P[0], N_FLAG, testBit(X[0], 7));

                    PC[0] += 1;
                    cycles -= 2;
                    break;

                // BNE Relative
                case 0xD0:
                    if (testBit(P[0], Z_FLAG)) {
                        PC[0] += 2;
                        cycles -= 2;
                    }
                    else {
                        TEMP[0] = me.readByte(PC[0] + 1);
                        PC[0] += (TEMP[0] + 2);
                        cycles -= 2;
                    }
                    break;

                default:
                    throw('Invalid opcode: ' + opCode.toString(16));
                    return;
            };
        }
    };

    this.interupt = function() {
        throw('Do the cpu interupt');
        P[0] = setBit(P[0], I_FLAG, true);
        //cpu_unset_flag(unused_bp);
        //cpu_stack_pushw(cpu.PC);
        //cpu_stack_pushb(cpu.P);
        //cpu.PC = cpu_nmi_interrupt_address();
    };

    this.writeByte = function(address, value) {
        switch (address >> 13) {
            case 0:
                console.log("Implement CPU RAM\n");
                break;

            case 1:
                ppu.writeIO(address, value);
                break;

            case 2:
                console.log("Implement PSG IO\n");
                break;

            case 3:
                console.log("Implement CPU RAM\n");
                break;

            default:
                memory[address] = value;
        }
    };

    this.readByte = function(address) {
        switch (address >> 13) {
            case 0:
                console.log("Implement CPU RAM\n");
                break;

            case 1:
                return ppu.readIO(address);
                break;

            case 2:
                console.log("Implement PSG IO\n");
                break;

            case 3: 
                console.log("Implement CPU RAM\n");
                break;

            default:
                return memory[address];
        }
    };

    this.readWord = function(address) {
        return memory[address] | memory[address + 1] << 8;
    };

    this.loadPrgData = function(prgData) {
        memory.set(prgData, 0x8000);
    };

    this.init = function() {

    };

    this.reset = function() {
        PC[0] = me.readWord(0xFFFC);
    };
};
