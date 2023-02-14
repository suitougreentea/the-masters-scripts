function resetValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  {
    const playersSheet = ss.getSheetByName(SheetNames.Players);
    const nameValidationBuilder = SpreadsheetApp.newDataValidation();
    nameValidationBuilder.requireFormulaSatisfied("=COUNTIF(A$2:A2, A2)=1");
    playersSheet.getRange("A2:A").setDataValidation(nameValidationBuilder.build());
  }
  {
    const entrySheet = ss.getSheetByName(SheetNames.Entry);
    const nameValidationBuilder = SpreadsheetApp.newDataValidation();
    nameValidationBuilder.requireFormulaSatisfied("=COUNTIF(A$3:A3, A3)=1");
    entrySheet.getRange("A3:A").setDataValidation(nameValidationBuilder.build());
  }
}

const SheetNames = {
  Players: "Players",
  Entry: "Entry",
}

function isNullOrEmptyString(string) {
  return string == null || string == "";
}

function parseGradeOrLevel(gradeOrLevel) {
  if (isNullOrEmptyString(gradeOrLevel)) return { grade: gmGrade, level: null }
  const parsedLevel = Number(gradeOrLevel);
  if (!isNaN(parsedLevel)) return { grade: null, level: parsedLevel }
  const parsedGrade = gradesTable.indexOf(gradeOrLevel)
  if (parsedGrade >= 0) return { grade: parsedGrade, level: null }
  throw new Error("Unknown Grade/Level: " + gradeOrLevel)
}
