import type { Module } from '@/lib/types';

export const MODULES: Module[] = [
  {
    id: 'lsm6ds3tr-c',
    name: 'LSM6DS3TR-C',
    description: '6-axis IMU with 3D accelerometer + 3D gyroscope, I2C/SPI digital interface.',
    partNumber: 'LSM6DS3TR-C',
    manufacturer: 'STMicroelectronics',
    external: true,
    interfaces: ['i2c', 'spi', 'digital'],
    tags: ['imu', 'accelerometer', 'gyroscope'],
    documentation: {
        datasheet: '#',
        diagram: '#'
    },
    operatingVoltage: [1.71, 3.6],
    ports: [
      { id: 'p1', name: 'VDD', type: 'power_in', position: 'left' },
      { id: 'p2', name: 'GND', type: 'gnd', position: 'left' },
      { id: 'p3', name: 'SCL', type: 'data_io', position: 'right' },
      { id: 'p4', name: 'SDA', type: 'data_io', position: 'right' },
    ],
  },
  {
    id: 'adafruit-16-channel-servo-shield',
    name: 'Adafruit 16-Channel 12-Bit PWM/Servo Shield',
    description: 'Arduino R3-compatible shield based on NXP PCA9685. Provides 16 independent 12-bit PWM outputs for servos or LEDs over I2C. Stackable up to 62 shields.',
    partNumber: 'Adafruit 16-Channel PWM/Servo Shield',
    manufacturer: 'Adafruit',
    external: true,
    interfaces: ['i2c', 'pwm', 'dc_power'],
    tags: ['shield', 'pwm_controller', 'servo_controller'],
    documentation: {
        datasheet: '#',
        diagram: '#'
    },
    operatingVoltage: [3.0, 5.0],
    ports: [
      { id: 'p1', name: 'VCC', type: 'power_in', position: 'left' },
      { id: 'p2', name: 'GND', type: 'gnd', position: 'left' },
      { id: 'p3', name: 'SCL', type: 'data_io', position: 'right' },
      { id: 'p4', name: 'SDA', type: 'data_io', position: 'right' },
    ],
  },
   {
    id: 'esp32-wroom-32',
    name: 'ESP32-WROOM-32',
    description: 'Powerful, generic Wi-Fi+BT+BLE MCU module that targets a wide variety of applications.',
    partNumber: 'ESP32-WROOM-32',
    manufacturer: 'Espressif Systems',
    external: true,
    interfaces: ['wifi', 'bluetooth', 'spi', 'i2c'],
    tags: ['microcontroller', 'wifi', 'bluetooth'],
     documentation: {
        datasheet: '#',
        diagram: '#'
    },
    operatingVoltage: [3.0, 3.6],
    ports: [
      { id: 'p1', name: '3V3', type: 'power_out', voltage: 3.3, position: 'left' },
      { id: 'p2', name: 'GND', type: 'gnd', position: 'left' },
      { id: 'p3', name: 'VIN', type: 'power_in', position: 'left' },
      { id: 'p4', name: 'GPIO21 (SDA)', type: 'data_io', position: 'right' },
      { id: 'p5', name: 'GPIO22 (SCL)', type: 'data_io', position: 'right' },
    ],
  },
];

// Helper to get a module by its ID
export const getModuleById = (id: string) => {
  return MODULES.find(m => m.id === id);
}
