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
  // Token is just username-based — anonymous callers are allowed (username/password auth)
  public shared func staffLogin(username : Text, password : Text) : async { #ok : Text; #err : Text } {
    switch (accounts.get(username)) {
      case null { #err("Invalid username or password") };
      case (?stored) {
        if (stored == password) {
          let token = "sess_" # username # "_kce";
          sessions.add(token, username);
          #ok(token);
        } else {
          #err("Invalid username or password");
        };
      };
    };
  };

  public shared func staffCreateAccount(username : Text, password : Text) : async { #ok; #err : Text } {
    if (username.size() < 3) {
      return #err("Username must be at least 3 characters long");
    };
    if (password.size() < 4) {
      return #err("Password must be at least 4 characters long");
    };
    if (accounts.containsKey(username)) {
      #err("Username \"" # username # "\" is already taken. Choose a different one.")
    } else {
      accounts.add(username, password);
      #ok;
    };
  };

  public shared func staffLogout(token : Text) : async () {
    sessions.remove(token);
  };

  // ── Helper: validate session token ───────────────────────────
  private func validateSession(token : Text) : ?Text {
    sessions.get(token);
  };

  // ── Subjects ──────────────────────────────────────────────────
  public query func getSubjectsForDept(deptKey : Text) : async [Subject] {
    switch (subjectsStore.get(deptKey)) {
      case null { [] };
      case (?subjs) { subjs };
    };
  };

  // Session token required — no anonymous check (staff use username/password)
  public shared func saveSubjectsForDept(token : Text, deptKey : Text, subjectsArg : [Subject]) : async { #ok; #err : Text } {
    switch (validateSession(token)) {
      case null { #err("Invalid or expired session. Please log in again.") };
      case (?_) {
        subjectsStore.add(deptKey, subjectsArg);
        #ok;
      };
    };
  };

  // ── Attendance ────────────────────────────────────────────────
  public shared func markAttendance(
    token : Text,
    subjectId : Text,
    date : Text,
    attendanceList : [AttendanceInput],
    dept : Text,
    year : Nat,
  ) : async { #ok; #err : Text } {
    switch (validateSession(token)) {
      case null { #err("Invalid or expired session. Please log in again.") };
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
    recordList.filter<AttendanceRecord>(
      func(r : AttendanceRecord) : Bool {
        r.regNo == regNo and r.dept == dept and r.year == year
      },
    );
  };

  public shared func getAttendanceByStaff(token : Text, dept : Text, year : Nat) : async { #ok : [AttendanceRecord]; #err : Text } {
    switch (validateSession(token)) {
      case null { #err("Invalid or expired session. Please log in again.") };
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
