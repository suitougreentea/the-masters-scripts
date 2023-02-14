function MASTERS_GETRESULT(names, bestTimes, grades, clearTimes) {
  if (!Array.isArray(names) || !Array.isArray(bestTimes) || !Array.isArray(grades) || !Array.isArray(clearTimes)) throw new Error();
  const rows = Math.min(names.length, bestTimes.length, grades.length, clearTimes.length);
  const scores = []
  for (let i = 0; i < rows; i++) {
    if (names[i][0] == "") continue;

    const { grade, level } = parseGradeOrLevel(grades[i][0]);
    var time = parseTimeFromString(clearTimes[i][0])
    var bestTime = timeFromSpreadsheetNative(bestTimes[i][0])
    var calcTime = time != null ? time - bestTime : null
    scores.push({
      name: names[i][0],
      level: level,
      grade: grade,
      time: time,
      calcTime: calcTime,
    });
  }

  scores.sort(compareResult).reverse();

  const result = []

  var top = scores[0]
  for (var i = 0; i < scores.length; i++) {
    var e = scores[i]
    var prev = scores[i-1]
    var score = null
    if (e.level != null) score = e.level
    if (e.grade != null) score = gradesTable[e.grade]
    var topDiff = null
    if (e.grade == gmGrade) topDiff = e.calcTime - top.calcTime
    var prevDiff = null
    if (prev != null && ((e.level != null && prev.level == e.level) || (e.grade != null && prev.grade == e.grade))) prevDiff = e.calcTime - prev.calcTime
    var rank = i + 1
    if (prev != null && compareResult(e, prev) == 0) rank = result[i-1][0]

    result.push([
      rank,
      e.name,
      score,
      timeToSpreadsheet(e.time),
      timeToSpreadsheet(e.calcTime),
      timeToSpreadsheet(topDiff),
      timeToSpreadsheet(prevDiff)
    ])
  }

  return result;
}