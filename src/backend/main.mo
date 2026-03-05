import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  type RegistrationNumber = Text;
  type SubjectId = Text;
  type SessionToken = Text;

  type AttendanceStatus = {
    #present;
    #absent;
    #onDuty;
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
    onDutyCount : Nat;
    percentage : Float;
  };

  type OverallAttendanceSummary = {
    regNo : RegistrationNumber;
    name : Text;
    subjectSummaries : [StudentAttendanceSummary];
    overallPercentage : Float;
  };

  public type UserProfile = {
    username : Text;
    role : Text;
  };

  // Initialize AccessControl and include MixinAuthorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let students = Map.empty<RegistrationNumber, Student>();
  let subjects = Map.empty<SubjectId, Subject>();
  let staffAccounts = Map.empty<Text, StaffAccount>();
  let attendanceRecords = Map.empty<Text, AttendanceRecord>();
  let sessions = Map.empty<SessionToken, Text>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToUsername = Map.empty<Principal, Text>();
  let usernameToPrincipal = Map.empty<Text, Principal>();

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };
    userProfiles.get(caller);
  };

  // ... rest of the implementation ...
};
