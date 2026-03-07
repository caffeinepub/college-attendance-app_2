import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import Runtime "mo:core/Runtime";



persistent actor {
  // ── Types ─────────────────────────────────────────────────────
  public type AttendanceStatus = { #present; #absent; #onDuty };
  public type Subject = { id : Text; name : Text };
  public type AttendanceRecord = {
    regNo : Text;
    subjectId : Text;
    date : Text;
    status : AttendanceStatus;
    staffUsername : Text;
    dept : Text;
    year : Nat;
  };
  public type AttendanceInput = { regNo : Text; status : AttendanceStatus };

  public type UserProfile = {
    username : Text;
    role : Text;
  };

  // ── Authorization mixin ───────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Persistent state ──────────────────────────────────────────
  var accounts = Map.empty<Text, Text>();
  var sessions = Map.empty<Text, Text>();
  var subjectsStore = Map.empty<Text, [Subject]>();
  var recordList : [AttendanceRecord] = [];
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ── Initialize default staff account ─────────────────────────
  system func postupgrade() {
    if (not accounts.containsKey("staff")) {
      accounts.add("staff", "2026");
    };
  };

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

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ── Staff Authentication ──────────────────────────────────────
  public shared ({ caller }) func staffLogin(username : Text, password : Text) : async { #ok : Text; #err : Text } {
    // Anonymous callers are allowed to login (guests can authenticate)
    switch (accounts.get(username)) {
      case null { #err("Invalid username or password") };
      case (?stored) {
        if (stored == password) {
          let token = username # "_" # caller.toText();
          sessions.add(token, username);
          #ok(token);
        } else {
          #err("Invalid username or password");
        };
      };
    };
  };

  public shared ({ caller }) func staffCreateAccount(username : Text, password : Text) : async { #ok; #err : Text } {
    // Anonymous callers are allowed to create accounts (guests can register)
    if (username.size() < 2) {
      return #err("Username must be at least 3 characters long");
    };
    if (password.size() < 3) {
      return #err("Password must be at least 4 characters long");
    };
    if (accounts.containsKey(username)) {
      #err("Username \"" # username # "\" is already taken. Choose a different one.")
    } else {
      accounts.add(username, password);
      #ok;
    };
  };

  public shared ({ caller }) func staffLogout(token : Text) : async () {
    // Any caller can logout their own session
    sessions.remove(token);
  };

  // ── Helper: validate session token and caller ────────────────
  private func validateSessionAndCaller(token : Text, caller : Principal) : ?Text {
    switch (sessions.get(token)) {
      case null { null };
      case (?username) {
        // Verify the token belongs to this caller
        let expectedToken = username # "_" # caller.toText();
        if (token == expectedToken) {
          ?username
        } else {
          null
        };
      };
    };
  };

  // ── Subjects ──────────────────────────────────────────────────
  // Public query - no auth required so any device can load subjects
  public query func getSubjectsForDept(deptKey : Text) : async [Subject] {
    switch (subjectsStore.get(deptKey)) {
      case null { [] };
      case (?subjs) { subjs };
    };
  };

  // Requires valid session token and caller verification
  public shared ({ caller }) func saveSubjectsForDept(token : Text, deptKey : Text, subjectsArg : [Subject]) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Anonymous users cannot save subjects");
    };
    switch (validateSessionAndCaller(token, caller)) {
      case null { #err("Invalid or expired session") };
      case (?_) {
        subjectsStore.add(deptKey, subjectsArg);
        #ok;
      };
    };
  };

  // ── Attendance ────────────────────────────────────────────────
  // Requires valid session token and caller verification
  public shared ({ caller }) func markAttendance(
    token : Text,
    subjectId : Text,
    date : Text,
    attendanceList : [AttendanceInput],
    dept : Text,
    year : Nat,
  ) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Anonymous users cannot mark attendance");
    };
    switch (validateSessionAndCaller(token, caller)) {
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

  // Public query - no auth required so any student on any device can view attendance
  public query func getStudentAttendance(regNo : Text, dept : Text, year : Nat) : async [AttendanceRecord] {
    recordList.filter<AttendanceRecord>(
      func(r : AttendanceRecord) : Bool {
        r.regNo == regNo and r.dept == dept and r.year == year
      },
    );
  };

  // Requires valid session token and caller verification
  // This now returns all records for matching dept/year, regardless of who submitted them
  public shared ({ caller }) func getAttendanceByStaff(token : Text, dept : Text, year : Nat) : async { #ok : [AttendanceRecord]; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Anonymous users cannot access staff attendance data");
    };
    switch (validateSessionAndCaller(token, caller)) {
      case null { #err("Invalid or expired session") };
      case (?_) {
        let records = recordList.filter(
          func(r : AttendanceRecord) : Bool {
            r.dept == dept and r.year == year
          },
        );
        #ok(records);
      };
    };
  };
};
