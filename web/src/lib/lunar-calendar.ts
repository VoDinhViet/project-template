import { addDaysToKey } from './vietnam-date'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const UNIX_EPOCH_JULIAN_DAY = 2440588
const UNIX_EPOCH_DATE_KEY = '1970-01-01'
/** Kỳ trăng mới đầu tiên của thế kỷ 20 (1900-01-01), mốc `k = 0` của công thức. */
const NEW_MOON_EPOCH_JULIAN_DAY = 2415021.076998695
const SYNODIC_MONTH_DAYS = 29.530588853
const DEGREE_TO_RADIAN = Math.PI / 180
/** Âm lịch Việt Nam tính theo kinh tuyến 105°Đ (UTC+7), khác lịch Trung Quốc (UTC+8) ở vài năm. */
const VIETNAM_TIME_ZONE_HOURS = 7
const MAX_LEAP_MONTH_SCAN = 14

/** Ngày Julian là số nguyên ứng với trưa của ngày; tính qua mốc 1970-01-01 bằng UTC thuần. */
function toJulianDay(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day) / MS_PER_DAY + UNIX_EPOCH_JULIAN_DAY
}

function toNewMoonJulianDay(newMoonIndex: number): number {
  const centuries = newMoonIndex / 1236.85
  const centuries2 = centuries * centuries
  const centuries3 = centuries2 * centuries
  const meanNewMoon =
    2415020.75933 +
    29.53058868 * newMoonIndex +
    0.0001178 * centuries2 -
    0.000000155 * centuries3 +
    0.00033 *
      Math.sin(
        (166.56 + 132.87 * centuries - 0.009173 * centuries2) *
          DEGREE_TO_RADIAN,
      )
  const sunAnomaly =
    (359.2242 +
      29.10535608 * newMoonIndex -
      0.0000333 * centuries2 -
      0.00000347 * centuries3) *
    DEGREE_TO_RADIAN
  const moonAnomaly =
    (306.0253 +
      385.81691806 * newMoonIndex +
      0.0107306 * centuries2 +
      0.00001236 * centuries3) *
    DEGREE_TO_RADIAN
  const moonLatitude =
    (21.2964 +
      390.67050646 * newMoonIndex -
      0.0016528 * centuries2 -
      0.00000239 * centuries3) *
    DEGREE_TO_RADIAN
  const correction =
    (0.1734 - 0.000393 * centuries) * Math.sin(sunAnomaly) +
    0.0021 * Math.sin(2 * sunAnomaly) -
    0.4068 * Math.sin(moonAnomaly) +
    0.0161 * Math.sin(2 * moonAnomaly) -
    0.0004 * Math.sin(3 * moonAnomaly) +
    0.0104 * Math.sin(2 * moonLatitude) -
    0.0051 * Math.sin(sunAnomaly + moonAnomaly) -
    0.0074 * Math.sin(sunAnomaly - moonAnomaly) +
    0.0004 * Math.sin(2 * moonLatitude + sunAnomaly) -
    0.0004 * Math.sin(2 * moonLatitude - sunAnomaly) -
    0.0006 * Math.sin(2 * moonLatitude + moonAnomaly) +
    0.001 * Math.sin(2 * moonLatitude - moonAnomaly) +
    0.0005 * Math.sin(2 * moonAnomaly + sunAnomaly)
  const deltaT =
    centuries < -11
      ? 0.001 +
        0.000839 * centuries +
        0.0002261 * centuries2 -
        0.00000845 * centuries3 -
        0.000000081 * centuries * centuries3
      : -0.000278 + 0.000265 * centuries + 0.000262 * centuries2
  return meanNewMoon + correction - deltaT
}

function toNewMoonDay(newMoonIndex: number): number {
  return Math.floor(
    toNewMoonJulianDay(newMoonIndex) + 0.5 + VIETNAM_TIME_ZONE_HOURS / 24,
  )
}

/** Cung hoàng đạo (0–11) của Mặt Trời lúc 0 giờ ngày đó; tháng không chứa trung khí là tháng nhuận. */
function toSunLongitudeSector(julianDay: number): number {
  const centuries =
    (julianDay - 0.5 - VIETNAM_TIME_ZONE_HOURS / 24 - 2451545) / 36525
  const centuries2 = centuries * centuries
  const meanAnomaly =
    (357.5291 +
      35999.0503 * centuries -
      0.0001559 * centuries2 -
      0.00000048 * centuries * centuries2) *
    DEGREE_TO_RADIAN
  const meanLongitude =
    280.46645 + 36000.76983 * centuries + 0.0003032 * centuries2
  const equationOfCenter =
    (1.9146 - 0.004817 * centuries - 0.000014 * centuries2) *
      Math.sin(meanAnomaly) +
    (0.019993 - 0.000101 * centuries) * Math.sin(2 * meanAnomaly) +
    0.00029 * Math.sin(3 * meanAnomaly)
  const longitude = (meanLongitude + equationOfCenter) * DEGREE_TO_RADIAN
  const normalizedLongitude =
    longitude - 2 * Math.PI * Math.floor(longitude / (2 * Math.PI))
  return Math.floor((normalizedLongitude / Math.PI) * 6)
}

/** Ngày bắt đầu tháng 11 âm (tháng chứa Đông chí) của năm dương `year`. */
function toLunarMonth11Start(year: number): number {
  const newMoonIndex = Math.floor(
    (toJulianDay(year, 12, 31) - 2415021) / SYNODIC_MONTH_DAYS,
  )
  const newMoonDay = toNewMoonDay(newMoonIndex)
  return toSunLongitudeSector(newMoonDay) >= 9
    ? toNewMoonDay(newMoonIndex - 1)
    : newMoonDay
}

function toLeapMonthOffset(month11Start: number): number {
  const newMoonIndex = Math.floor(
    (month11Start - NEW_MOON_EPOCH_JULIAN_DAY) / SYNODIC_MONTH_DAYS + 0.5,
  )
  let monthOffset = 1
  let sector = toSunLongitudeSector(toNewMoonDay(newMoonIndex + monthOffset))
  let previousSector: number
  do {
    previousSector = sector
    monthOffset += 1
    sector = toSunLongitudeSector(toNewMoonDay(newMoonIndex + monthOffset))
  } while (sector !== previousSector && monthOffset < MAX_LEAP_MONTH_SCAN)
  return monthOffset - 1
}

/**
 * Ngày dương (`YYYY-MM-DD`) của ngày âm `lunarDay/lunarMonth` năm âm `lunarYear`.
 *
 * Rules:
 * - Theo thuật toán của Hồ Ngọc Đức (thiên văn, không cần bảng tra theo năm).
 * - Chỉ hỗ trợ tháng không nhuận: các ngày lễ âm lịch đều nằm ở tháng thường.
 */
export function toSolarDateKeyFromLunar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
): string {
  const [month11Start, nextMonth11Start] =
    lunarMonth < 11
      ? [toLunarMonth11Start(lunarYear - 1), toLunarMonth11Start(lunarYear)]
      : [toLunarMonth11Start(lunarYear), toLunarMonth11Start(lunarYear + 1)]
  const newMoonIndex = Math.floor(
    0.5 + (month11Start - NEW_MOON_EPOCH_JULIAN_DAY) / SYNODIC_MONTH_DAYS,
  )
  const monthOffset = (lunarMonth - 11 + 12) % 12
  // Năm có 13 tháng: các tháng từ sau tháng nhuận trở đi lùi một kỳ trăng.
  const isLeapYear = nextMonth11Start - month11Start > 365
  const shiftedMonthOffset =
    isLeapYear && monthOffset >= toLeapMonthOffset(month11Start)
      ? monthOffset + 1
      : monthOffset
  const julianDay =
    toNewMoonDay(newMoonIndex + shiftedMonthOffset) + lunarDay - 1
  return addDaysToKey(UNIX_EPOCH_DATE_KEY, julianDay - UNIX_EPOCH_JULIAN_DAY)
}
