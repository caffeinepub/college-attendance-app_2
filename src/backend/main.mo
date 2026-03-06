import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Principal "mo:core/Principal";

actor {
  // ── Types ─────────────────────────────────────────────────────
  type AttendanceStatus = { #present; #absent; #onDuty };
  type Subject = { id : Text; name : Text };
  type AttendanceRecord = {
    regNo : Text;
    subjectId : Text;
    date : Text;
    status : AttendanceStatus;
    staffUsername : Text;
    dept : Text;
    year : Nat;
  };
  type AttendanceInput = { regNo : Text; status : AttendanceStatus };

  public type UserProfile = {
    username : Text;
    role : Text;
  };

  // ── Legacy types (for upgrade migration only) ─────────────────
  type LegacyStudent = { registrationNumber : Text; name : Text };
  type LegacySubjectEntry = { id : Text; name : Text };
  type LegacyStaffAccount = { username : Text; password : Text };
  type LegacyAttendanceRecord = {
    regNo : Text;
    subjectId : Text;
    date : Text;
    status : AttendanceStatus;
    staffUsername : Text;
  };

  // ── Authorization mixin ───────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Persistent state ──────────────────────────────────────────
  let accounts = Map.empty<Text, Text>();
  let sessions = Map.empty<Text, Text>();
  let subjectsStore = Map.empty<Text, [Subject]>();
  var recordList : [AttendanceRecord] = [];
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ── Legacy stable vars declared to allow upgrade migration ────
  // These existed in the previous canister version. Declaring them here
  // (even unused) satisfies the compatibility checker so the upgrade
  // does not require an explicit migration function.
  let students = Map.empty<Text, LegacyStudent>();
  let subjects = Map.empty<Text, LegacySubjectEntry>();
  let staffAccounts = Map.empty<Text, LegacyStaffAccount>();
  let attendanceRecords = Map.empty<Text, LegacyAttendanceRecord>();
  let principalToUsername = Map.empty<Principal, Text>();
  let usernameToPrincipal = Map.empty<Text, Principal>();

  // ── Initialize default staff account ─────────────────────────
  do {
    if (not accounts.containsKey("staff")) {
      accounts.add("staff", "2026");
    };
  };

  // ── User Profile (required by frontend) ──────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };
    userProfiles.get(caller);
  };

  // ── Staff Authentication ──────────────────────────────────────
  public func staffLogin(username : Text, password : Text) : async { #ok : Text; #err : Text } {
    switch (accounts.get(username)) {
      case null { #err("Invalid username or password") };
      case (?stored) {
        if (stored == password) {
          let t : Int = Time.now();
          let token = username # "_" # t.toText();
          sessions.add(token, username);
          #ok(token);
        } else {
          #err("Invalid username or password");
        };
      };
    };
  };

  public func staffCreateAccount(username : Text, password : Text) : async { #ok; #err : Text } {
    if (accounts.containsKey(username)) {
      #err("Username \"" # username # "\" is already taken. Choose a different one.")
    } else {
      accounts.add(username, password);
      #ok;
    };
  };

  public func staffLogout(token : Text) : async () {
    sessions.remove(token);
  };

  // ── Subjects ──────────────────────────────────────────────────
  public query func getSubjectsForDept(deptKey : Text) : async [Subject] {
    switch (subjectsStore.get(deptKey)) {
      case null { [] };
      case (?subjs) { subjs };
    };
  };

  public func saveSubjectsForDept(token : Text, deptKey : Text, subjectsArg : [Subject]) : async { #ok; #err : Text } {
    switch (sessions.get(token)) {
      case null { #err("Invalid or expired session") };
      case (?_) {
        subjectsStore.add(deptKey, subjectsArg);
        #ok;
      };
    };
  };

  // ── Attendance ────────────────────────────────────────────────
  public func markAttendance(
    token : Text,
    subjectId : Text,
    date : Text,
    attendanceList : [AttendanceInput],
    dept : Text,
    year : Nat,
  ) : async { #ok; #err : Text } {
    switch (sessions.get(token)) {
      case null { #err("Invalid or expired session") };
      case (?username) {
        let filtered = recordList.filter(
          func(r : AttendanceRecord) : Bool {
            not (r.subjectId == subjectId and r.date == date and r.dept == dept and r.year == year);
          },
        );
        let newRecords = attendanceList.map(
          func(entry : AttendanceInput) : AttendanceRecord {
            {
              regNo = entry.regNo;
              subjectId;
              date;
              status = entry.status;
              staffUsername = username;
              dept;
              year;
            };
          },
        );
        recordList := filtered.concat(newRecords);
        #ok;
      };
    };
  };

  public query func getStudentAttendance(regNo : Text, dept : Text, year : Nat) : async [AttendanceRecord] {
    recordList.filter(func(r : AttendanceRecord) : Bool {
      r.regNo == regNo and r.dept == dept and r.year == year
    });
  };

  public func getAttendanceByStaff(token : Text, dept : Text, year : Nat) : async { #ok : [AttendanceRecord]; #err : Text } {
    switch (sessions.get(token)) {
      case null { #err("Invalid or expired session") };
      case (?username) {
        let records = recordList.filter(func(r : AttendanceRecord) : Bool {
          r.staffUsername == username and r.dept == dept and r.year == year
        });
        #ok(records);
      };
    };
  };
};
