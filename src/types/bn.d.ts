declare module 'bn.js' {
  class BN {
    constructor(number: number | string | number[] | Uint8Array | Buffer | BN, base?: number | 'hex', endian?: string | 'le' | 'be');
    
    static isBN(b: any): boolean;
    static max(left: BN, right: BN): BN;
    static min(left: BN, right: BN): BN;
    static red(reductionContext: any): any;
    
    clone(): BN;
    toString(base?: number | 'hex', length?: number): string;
    toNumber(): number;
    toJSON(): string;
    toArray(endian?: string, length?: number): number[];
    toBuffer(endian?: string, length?: number): Buffer;
    bitLength(): number;
    zeroBits(): number;
    byteLength(): number;
    isNeg(): boolean;
    isEven(): boolean;
    isOdd(): boolean;
    isZero(): boolean;
    cmp(b: BN): number;
    lt(b: BN): boolean;
    lte(b: BN): boolean;
    gt(b: BN): boolean;
    gte(b: BN): boolean;
    eq(b: BN): boolean;
    isBN(b: any): boolean;
    
    neg(): BN;
    abs(): BN;
    add(b: BN): BN;
    sub(b: BN): BN;
    mul(b: BN): BN;
    muln(b: number): BN;
    sqr(): BN;
    pow(b: BN): BN;
    div(b: BN): BN;
    divn(b: number): BN;
    mod(b: BN): BN;
    modn(b: number): number;
    divRound(b: BN): BN;
    
    or(b: BN): BN;
    and(b: BN): BN;
    xor(b: BN): BN;
    setn(b: number): BN;
    shln(b: number): BN;
    shrn(b: number): BN;
    testn(b: number): boolean;
    maskn(b: number): BN;
    bincn(b: number): BN;
    notn(w: number): BN;
    
    gcd(b: BN): BN;
    egcd(b: BN): { a: BN; b: BN; gcd: BN };
    invm(b: BN): BN;
  }
  
  export default BN;
  export { BN };
}
