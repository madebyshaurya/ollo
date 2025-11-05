export interface SamplePart {
  id: string
  category: string
  supplier: string
  supplierUrl: string
  image: string
  manufacturer: string
  mpn: string
  price: number
  currency: string
  moq: number
  stock: number
  leadTime: string
  description: string
  projectTypes: Array<"breadboard" | "pcb" | "custom">
}

export const SAMPLE_PARTS: SamplePart[] = [
  {
    id: "tps7a4700rgtr",
    category: "Clean voltage regulation",
    supplier: "Mouser",
    supplierUrl: "https://www.mouser.com/ProductDetail/Texas-Instruments/TPS7A4700RGTR",
    image: "https://assets.mouser.com/images/texasinst/lrg/tps7a4700.jpg",
    manufacturer: "Texas Instruments",
    mpn: "TPS7A4700RGTR",
    price: 3.92,
    currency: "USD",
    moq: 1,
    stock: 12450,
    leadTime: "In stock",
    description: "1A low-noise LDO regulator, ideal for precision analog rails.",
    projectTypes: ["pcb", "custom"],
  },
  {
    id: "esp32-s3",
    category: "Connectivity & control",
    supplier: "Digi-Key",
    supplierUrl: "https://www.digikey.com/en/products/detail/espressif-systems/ESP32-S3-WROOM-1-N16/14423129",
    image: "https://media.digikey.com/Photos/Espressif%20Systems/MFG_ESP32-S3-WROOM-1.jpg",
    manufacturer: "Espressif Systems",
    mpn: "ESP32-S3-WROOM-1-N16",
    price: 3.25,
    currency: "USD",
    moq: 1,
    stock: 32560,
    leadTime: "In stock",
    description: "Wi-Fi + BLE MCU module with 16 MB flash for connected builds.",
    projectTypes: ["breadboard", "pcb", "custom"],
  },
  {
    id: "bsc340n08ns3",
    category: "Power switching",
    supplier: "JLCPCB",
    supplierUrl: "https://jlcpcb.com/partdetail/InfineonTechnologies-BSC340N08NS3GATMA1/C507144",
    image: "https://image.jlcpcb.com/parts/c507144.jpg",
    manufacturer: "Infineon Technologies",
    mpn: "BSC340N08NS3G",
    price: 0.67,
    currency: "USD",
    moq: 5,
    stock: 86000,
    leadTime: "2 days",
    description: "40V N-channel MOSFET, low Rds(on) for efficient power stages.",
    projectTypes: ["pcb", "custom"],
  },
  {
    id: "bme280",
    category: "Sensing & telemetry",
    supplier: "LCSC",
    supplierUrl: "https://www.lcsc.com/product-detail/Sensors_BOSCH_BME280_C96552.html",
    image: "https://cdn.lcsc.com/images/product/LCSC_BME280.jpg",
    manufacturer: "Bosch Sensortec",
    mpn: "BME280",
    price: 2.15,
    currency: "USD",
    moq: 1,
    stock: 40210,
    leadTime: "In stock",
    description: "Temperature, humidity, and barometric pressure sensor.",
    projectTypes: ["breadboard", "pcb", "custom"],
  },
  {
    id: "stm32g474",
    category: "Performance microcontroller",
    supplier: "PCBWay",
    supplierUrl: "https://www.pcbway.com/pcb_prototype/stm32g474RET6.html",
    image: "https://www.pcbway.com/upload/product/STM32G4.png",
    manufacturer: "STMicroelectronics",
    mpn: "STM32G474RET6",
    price: 6.8,
    currency: "USD",
    moq: 5,
    stock: 11500,
    leadTime: "3-5 days",
    description: "170 MHz Cortex-M4 MCU with high-resolution timers and rich analog.",
    projectTypes: ["pcb", "custom"],
  },
  {
    id: "qwiic-conn",
    category: "Rapid prototyping",
    supplier: "SparkFun",
    supplierUrl: "https://www.sparkfun.com/products/14425",
    image: "https://cdn.sparkfun.com/r/600-600/assets/parts/1/3/2/9/9/14425-Qwiic_Cable_-_100mm-01.jpg",
    manufacturer: "SparkFun",
    mpn: "PRT-14425",
    price: 1.5,
    currency: "USD",
    moq: 1,
    stock: 520,
    leadTime: "In stock",
    description: "Qwiic JST connector cable for fast I2C prototyping.",
    projectTypes: ["breadboard", "custom"],
  },
]
