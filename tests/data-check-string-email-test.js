/*global describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const _ = require('underscore');
const should = require('chai').should();

const checkStringEmailFactory = require('../lib/recordCheck/data-check-string-email').createChecks;


// The cont to be checked by the file check
const content = {
  "first-name": "Adelberg",
  "lastName": "Slurpy",
  "street": "Am Kartoffelackker 0815",
  "email": "foo.bar@gumbo.de",
  "country": "de",
  "empty_string": "",
  "null_string": null
};

const fieldDefinitionString = {
  "fieldType": {
    "type": "string",
    "fieldCase": "case_sensitive",
    "minLength": 5,
    "maxLength": 21,
    "regEx": ""
  },
  "severity": "abort_file",
  "defaultValue": "my default val"
};

const fieldDefinitionStringComplex = {
  "fieldType": {
    "type": "string",
    "fieldCase": "case_sensitive",
    "minLength": {
      "val": 5,
      "severity": "skip_field"
    },
    "maxLength": {
      "val": 21,
      "severity": "skip_record"
    },
    "regEx": {
      "val": "^AB.*ff.*$",
      "severity": "abort_scope"
    },
  },
  "severity": "abort_file",
  "defaultValue": "my default val"
};

const fieldDefinitionEmail = {
  "fieldType": {
    "type": "email",
    "fieldCase": "case_sensitive",
    "maxLength": 64,
    "regEx": ""
  },
  "severity": "abort_file",
  "defaultValue": "default@email.com"
};


// valid and invalid addresses
const validEmails = [
  "john.doe@example.com",
  "_somename@example.com",
  "someone+something@example.com",
  "!def!xyz%abc@example.com",
  "customer/department=shipping@example.com",
  "email@subdomain.example.com",
  "firstname.lastname@example.com"
];

const invalidEmails = [
  "john@doe",
  "john@doe@example.com",
  "@example.com",
  "john@.com",
  "#@%^%#$@#$@#.com",
  "あいうえお@example.com",
  "email..email@example.com",
  "just”not”right@example.com",
  "email@-example.com",
  "email@example.com (Joe Smith)",
  "Joe Smith <email@example.com>",
  ""
];


describe("file-check-email", function () {


  it("accepts valid email addresses", function () {
    let fieldName = "email";
    let checks = checkStringEmailFactory(fieldDefinitionEmail, fieldName);
    let cont = _.clone(content);

    validEmails.map(function (val) {
      // The content to be checked by the file check
      cont = {
        "email": val
      };

      let errors = [];
      checks.forEach(function (check) {
        let error = check(cont);
        if (error) {
          errors.push(error);
        }
      });

      errors.length.should.equal(0);
    });
  });

  it("accepts valid email addresses with whitespace padding", function () {
    let fieldName = "email";
    let checks = checkStringEmailFactory(fieldDefinitionEmail, fieldName);
    let cont = _.clone(content);

    validEmails.map(function (val) {
      // The content to be checked by the file check
      cont = {
        "email": "\t " + val + " \n "
      };

      let errors = [];
      checks.forEach(function (check) {
        let error = check(cont);
        if (error) {
          errors.push(error);
        }
      });

      errors.length.should.equal(0);
    });
  });

  it("rejects invalid email addresses and uses the default value", function () {
    let fieldName = "email";
    let checks = checkStringEmailFactory(fieldDefinitionEmail, fieldName);
    let cont = _.clone(content);

    invalidEmails.map(function (val) {
      // The content to be checked by the file check
      cont = {
        "email": val
      };

      let errors = [];
      checks.forEach(function (check) {
        let error = check(cont);
        if (error) {
          errors.push(error);
        }
      });
      errors.length.should.equal(1);
      errors[0].errorCode.should.equal("NOT_EMAIL");
      errors[0].severity.should.equal("abort_file");
      // cont[fieldName].should.equal("default@email.com");
      // TODO to be clarified. If an email is invalid it will not deleted be the check. And therefor it
      // will not be replaced by the default value. For boolean and date fields it is done this way. What
      // would be the expected behavior for Strings and emails????
    });
  });

});

describe("file-check-string", function () {


  it("Checks for the right amount of checks to be created", function () {
    let checks = checkStringEmailFactory(fieldDefinitionString, "first-name");
    checks.length.should.equal(4);
  });

  it("check null value will be set with default", function () {
    let fieldName = "null_string";
    let checks = checkStringEmailFactory(fieldDefinitionString, fieldName);
    let cont = _.clone(content);

    checks.forEach(function (check) {
      let errors = check(cont);
      should.not.exist(errors);
    });
    should.exist(cont[fieldName]);
    cont[fieldName].should.equal("my default val");
  });

  // An empty string is still a string and will NOT be set to default
  it("check emtpty string value will be set with default", function () {
    let fieldName = "empty_string";
    let checks = checkStringEmailFactory(fieldDefinitionString, fieldName);
    let cont = _.clone(content);

    checks.forEach(function (check) {
      let errors = check(cont);
    });
    should.exist(cont[fieldName]);
    cont[fieldName].should.equal("");
  });

  it("check value is too short", function () {
    let fieldName = "country";
    let checks = checkStringEmailFactory(fieldDefinitionString, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    errors.length.should.equal(1);
    errors[0].errorCode.should.equal("STRING_MIN_LENGTH");
    errors[0].severity.should.equal("abort_file");
    cont[fieldName].should.equal("de");
  });

  it("check value is too short own severity", function () {
    let fieldName = "country";
    let checks = checkStringEmailFactory(fieldDefinitionStringComplex, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    // the reg ex does not match also. Therfore there are two errors
    errors.length.should.equal(2);
    errors[0].errorCode.should.equal("STRING_MIN_LENGTH");
    errors[0].severity.should.equal("skip_field");
    cont[fieldName].should.equal("de");
  });

  it("check value is too long", function () {
    let fieldName = "street";
    let checks = checkStringEmailFactory(fieldDefinitionString, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    errors.length.should.equal(1);
    errors[0].errorCode.should.equal("STRING_MAX_LENGTH");
    errors[0].severity.should.equal("abort_file");
    cont[fieldName].should.equal("Am Kartoffelackker 08");
  });

  it("check value is too long own severity", function () {
    let fieldName = "street";
    let checks = checkStringEmailFactory(fieldDefinitionStringComplex, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    // the reg ex does not match also. Therfore there are two errors
    errors.length.should.equal(2);
    errors[0].errorCode.should.equal("STRING_MAX_LENGTH");
    errors[0].severity.should.equal("skip_record");
    cont[fieldName].should.equal("Am Kartoffelackker 08");
  });


  it("check value toUpper", function () {
    let fieldName = "lastName";
    let checks = checkStringEmailFactory({
      "fieldType": {
        "type": "string",
        "fieldCase": "upper"
      },
      "severity": "abort_file",
      "defaultValue": "my default val"
    }, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    errors.length.should.equal(0);
    cont[fieldName].should.equal("SLURPY");
  });

  it("check value toLower", function () {
    let fieldName = "lastName";
    let checks = checkStringEmailFactory({
      "fieldType": {
        "type": "string",
        "fieldCase": "lower"
      },
      "severity": "abort_file",
      "defaultValue": "my default val"
    }, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    errors.length.should.equal(0);
    cont[fieldName].should.equal("slurpy");
  });

  it("check regEx match", function () {
    let fieldName = "street";
    let checks = checkStringEmailFactory({
      "fieldType": {
        "type": "string",
        "regEx": "^.*ff.*$"
      },
      "severity": "abort_file",
      "defaultValue": "my default val"
    }, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    errors.length.should.equal(0);
    cont[fieldName].should.equal("Am Kartoffelackker 0815");
  });

  it("check regEx does not match", function () {
    let fieldName = "street";
    let checks = checkStringEmailFactory({
      "fieldType": {
        "type": "string",
        "regEx": "^AB.*ff.*$"
      },
      "severity": "abort_file",
      "defaultValue": "my default val"
    }, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    errors.length.should.equal(1);
    errors[0].errorCode.should.equal("STRING_REG_EX");
    errors[0].severity.should.equal("abort_file");
    cont[fieldName].should.equal("Am Kartoffelackker 0815");
  });


  it("check regEx does not match with own severity in file type", function () {
    let fieldName = "street";
    let checks = checkStringEmailFactory({
      "fieldType": {
        "type": "string",
        "regEx": "^AB.*ff.*$",
        "severity": "abort_record"
      },
      "severity": "abort_file",
      "defaultValue": "my default val"
    }, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    errors.length.should.equal(1);
    errors[0].errorCode.should.equal("STRING_REG_EX");
    errors[0].severity.should.equal("abort_record");
    cont[fieldName].should.equal("Am Kartoffelackker 0815");
  });

  it("check regEx does not match with own severity in regEx", function () {
    let fieldName = "street";
    let checks = checkStringEmailFactory({
      "fieldType": {
        "type": "string",
        "regEx": {
          "val": "^AB.*ff.*$",
          "severity": "skip_field"
        },
        "severity": "skip_record"
      },
      "severity": "abort_file",
      "defaultValue": "my default val"
    }, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    errors.length.should.equal(1);
    errors[0].errorCode.should.equal("STRING_REG_EX");
    errors[0].severity.should.equal("skip_field");
    cont[fieldName].should.equal("Am Kartoffelackker 0815");
  });

  it("check regEx does not match own severity", function () {
    let fieldName = "street";
    let checks = checkStringEmailFactory(fieldDefinitionStringComplex, fieldName);
    let cont = _.clone(content);

    let errors = [];
    checks.forEach(function (check) {
      let error = check(cont);
      if (error) {
        errors.push(error);
      }
    });
    // Max Length also exeeded
    errors.length.should.equal(2);
    errors[1].errorCode.should.equal("STRING_REG_EX");
    errors[1].severity.should.equal("abort_scope");
    cont[fieldName].should.equal("Am Kartoffelackker 08");
  });


});
