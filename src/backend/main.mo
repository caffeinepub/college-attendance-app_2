import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  type RegistrationNumber = Text;
  type SubjectId = Text;
  type SessionToken = Text;

  type AttendanceStatus = {
    #present;
    #absent;
  };

  type Student = {
    registrationNumber : RegistrationNumber;
    name : Text;
  };

  module Student {
    public func compare(student1 : Student, student2 : Student) : Order.Order {
      compareByNameInterval(student1, student2, 0);
    };

    public func fromTuple(tuple : (Text, Text)) : Student {
      let (registrationNumber, name) = tuple;
      { registrationNumber; name };
    };

    public func compareByNameInterval(student1 : Student, student2 : Student, index : Nat) : Order.Order {
      let name1 = student1.name;
      let name2 = student2.name;
      if (Text.equal(name1, name2)) {
        return Text.compare(student1.registrationNumber, student2.registrationNumber);
      };

      let chars1 = name1.toArray();
      let chars2 = name2.toArray();

      if (index >= chars1.size()) {
        return #less;
      };
      if (index >= chars2.size()) {
        return #greater;
      };

      if (chars1[index] != chars2[index]) {
        if (chars1[index] < chars2[index]) {
          #less;
        } else {
          #greater;
        };
      } else {
        compareByNameInterval(student1, student2, index + 1);
      };
    };
  };

  type Subject = {
    id : SubjectId;
    name : Text;
  };

  type AttendanceRecord = {
    regNo : RegistrationNumber;
    subjectId : SubjectId;
    date : Text;
    status : AttendanceStatus;
    staffUsername : Text;
  };

  type StaffAccount = {
    username : Text;
    password : Text;
  };

  type AttendanceInput = {
    regNo : RegistrationNumber;
    status : AttendanceStatus;
  };

  type StudentAttendanceSummary = {
    subjectName : Text;
    totalClasses : Nat;
    presentCount : Nat;
    absentCount : Nat;
    percentage : Float;
  };

  type OverallAttendanceSummary = {
    regNo : RegistrationNumber;
    name : Text;
    subjectSummaries : [StudentAttendanceSummary];
    overallPercentage : Float;
  };

  let students = Map.empty<RegistrationNumber, Student>();
  let subjects = Map.empty<SubjectId, Subject>();
  let staffAccounts = Map.empty<Text, StaffAccount>();
  let attendanceRecords = Map.empty<Text, AttendanceRecord>();
  let sessions = Map.empty<SessionToken, Text>();

  func initializeSeedData() {
    let studentList = [
      ("2021CS001", "Ananya Sharma"),
      ("2021CS002", "Rahul Verma"),
      ("2021CS003", "Priya Singh"),
      ("2021CS004", "Amit Patel"),
      ("2021CS005", "Sneha Reddy"),
      ("2021CS006", "Rohit Gupta"),
      ("2021CS007", "Neha Desai"),
      ("2021CS008", "Vikas Nair"),
      ("2021CS009", "Aishwarya Iyer"),
      ("2021CS010", "Karan Mehta"),
    ];

    let subjectList = [
      ("MATH101", "Mathematics"),
      ("PHY101", "Physics"),
      ("CHEM101", "Chemistry"),
      ("ENG101", "English"),
      ("CS101", "Computer Science"),
    ];

    let staffList = [
      ("staff1", "pass1"),
      ("staff2", "pass2"),
      ("admin", "admin123"),
    ];

    for (student in studentList.values()) {
      let studentObj = Student.fromTuple(student);
      students.add(studentObj.registrationNumber, studentObj);
    };

    for (subject in subjectList.values()) {
      let (id, name) = subject;
      subjects.add(id, { id; name });
    };

    for (staff in staffList.values()) {
      let (username, password) = staff;
      staffAccounts.add(username, { username; password });
    };

    let attendanceSeedData = [
      ("2021CS001", "MATH101", "2023-09-01", #present, "staff1"),
      ("2021CS001", "PHY101", "2023-09-01", #absent, "staff2"),
      ("2021CS002", "MATH101", "2023-09-01", #present, "staff1"),
      ("2021CS003", "CHEM101", "2023-09-01", #present, "admin"),
      ("2021CS004", "ENG101", "2023-09-02", #absent, "staff2"),
      ("2021CS005", "CS101", "2023-09-02", #present, "admin"),
      ("2021CS006", "MATH101", "2023-09-03", #present, "staff1"),
      ("2021CS007", "PHY101", "2023-09-03", #present, "staff2"),
      ("2021CS008", "CHEM101", "2023-09-03", #absent, "admin"),
      ("2021CS009", "ENG101", "2023-09-04", #present, "staff2"),
      ("2021CS010", "CS101", "2023-09-04", #present, "admin"),
    ];

    for (record in attendanceSeedData.values()) {
      let (regNo, subjectId, date, status, staffUsername) = record;
      let attendanceRecord : AttendanceRecord = {
        regNo;
        subjectId;
        date;
        status;
        staffUsername;
      };
      let recordKey = regNo.concat(subjectId).concat(date);
      attendanceRecords.add(recordKey, attendanceRecord);
    };
  };

  func convertAttendanceStatus(status : AttendanceStatus) : Nat {
    switch (status) {
      case (#present) { 1 };
      case (#absent) { 0 };
    };
  };

  public shared ({ caller }) func initiateSeedData() : async () {
    initializeSeedData();
  };

  public query ({ caller }) func login(username : Text, password : Text) : async SessionToken {
    switch (staffAccounts.get(username)) {
      case (null) { Runtime.trap("User not found") };
      case (?account) {
        if (account.password != password) {
          Runtime.trap("Invalid password");
        };
        let token = username.concat(password);
        sessions.add(token, username);
        token;
      };
    };
  };

  public shared ({ caller }) func logout(token : SessionToken) : async () {
    switch (sessions.get(token)) {
      case (null) { Runtime.trap("Session not found") };
      case (?_) {
        sessions.remove(token);
      };
    };
  };

  public query ({ caller }) func getStudents() : async [Student] {
    students.values().toArray().sort();
  };

  public query ({ caller }) func getSubjects() : async [Subject] {
    subjects.values().toArray();
  };

  public shared ({ caller }) func markAttendance(token : SessionToken, subjectId : SubjectId, date : Text, attendanceList : [AttendanceInput]) : async () {
    switch (sessions.get(token)) {
      case (null) { Runtime.trap("Invalid session token") };
      case (?staffUsername) {
        for (entry in attendanceList.values()) {
          let record : AttendanceRecord = {
            regNo = entry.regNo;
            subjectId;
            date;
            status = entry.status;
            staffUsername;
          };
          let recordKey = entry.regNo.concat(subjectId).concat(date);
          attendanceRecords.add(recordKey, record);
        };
      };
    };
  };

  public query ({ caller }) func getAttendanceByStaff(token : SessionToken) : async [AttendanceRecord] {
    switch (sessions.get(token)) {
      case (null) { Runtime.trap("Invalid session token") };
      case (?staffUsername) {
        attendanceRecords.values().toArray().filter(func(record) { record.staffUsername == staffUsername });
      };
    };
  };

  public query ({ caller }) func getStudentAttendanceSummary(regNo : RegistrationNumber) : async OverallAttendanceSummary {
    switch (students.get(regNo)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) {
        let subjectSummaries : [StudentAttendanceSummary] = subjects.values().toArray().map<Subject, StudentAttendanceSummary>(
          func(subject) {
            let records = attendanceRecords.values().toArray().filter(
              func(record) { record.regNo == regNo and record.subjectId == subject.id }
            );

            let presentCount = records.filter(func(record) { record.status == #present }).size();
            let absentCount = records.filter(func(record) { record.status == #absent }).size();
            let totalClasses = presentCount + absentCount;
            let percentage : Float = if (totalClasses == 0) {
              0.0;
            } else {
              (presentCount.toFloat() / totalClasses.toFloat()) * 100.0;
            };

            {
              subjectName = subject.name;
              totalClasses;
              presentCount;
              absentCount;
              percentage;
            };
          }
        );

        let allRecords = attendanceRecords.values().toArray().filter(func(record) { record.regNo == regNo });
        let totalClasses = allRecords.size();
        let presentCount = allRecords.filter(func(record) { record.status == #present }).size();
        let overallPercentage : Float = if (totalClasses == 0) {
          0.0;
        } else {
          (presentCount.toFloat() / totalClasses.toFloat()) * 100.0;
        };

        {
          regNo = student.registrationNumber;
          name = student.name;
          subjectSummaries;
          overallPercentage;
        };
      };
    };
  };

  public query ({ caller }) func getStudentAttendanceRecords(regNo : RegistrationNumber) : async [AttendanceRecord] {
    attendanceRecords.values().toArray().filter(func(record) { record.regNo == regNo });
  };

  public shared ({ caller }) func resetAttendanceData() : async () {
    attendanceRecords.clear();
    sessions.clear();
  };
};
