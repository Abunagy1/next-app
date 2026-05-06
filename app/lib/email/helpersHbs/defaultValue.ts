export default function defaultValue(value: any, defaultValue: any): any {
  return value === undefined || value === null || value === '' ? defaultValue : value;
}