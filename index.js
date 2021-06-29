///require
const mysql = require("mysql");
const inquirer = require("inquirer");

///connection
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "rootmysql",
  database: "employeesDB"
});

/// mysql server and sql database connect
connection.connect(function (err) {
  if (err) throw err;
  action();
});

/// function which prompts the user for what action they should take
function action() {

  inquirer
  /// Possible action tasks
    .prompt({
      type: "list",
      name: "task",
      message: "What would you like to do?",
      choices: [
        "View Employees",
        "View Employees by Department",
        "Add an Employee",
        "Remove an Employees",
        "Update an Employee's Role",
        "Add a Role",
        "Nothing"]
    })
    /// What happens with each chosen task
    .then(function ({ task }) {
      switch (task) {
        case "View Employees":
          ViewEmployees();
          break;
        case "View Employees by Department":
          ViewEmployeesByDepartment();
          break;
        case "Add an Employee":
          addEmployee();
          break;
        case "Remove an Employees":
          removeEmployee();
          break;
        case "Update an Employee's Role":
          updateRole();
          break;
        case "Add a Role":
          addRole();
          break;
        case "Nothing":
          connection.Nothing();
          break;
      }
    });
}

/// View Employees task
function ViewEmployees() {
  console.log("Viewing all employees\n");

  var query =
    `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary AS budget, CONCAT(m.first_name, ' ', m.last_name) AS manager
  FROM employee e
  LEFT JOIN role r
	ON e.role_id = r.id
  LEFT JOIN department d
  ON d.id = r.department_id
  LEFT JOIN employee m
	ON m.id = e.manager_id`

  connection.query(query, function (err, res) {
    if (err) throw err;

    console.table(res);
    console.log("Employees have been viewed\n");

    action();
  });
}

/// View Employees by Department

function ViewEmployeesByDepartment() {
  console.log("Viewing all employees by department\n");

  var query =
    `SELECT d.id, d.name, r.salary AS budget
  FROM employee e
  LEFT JOIN role r
	ON e.role_id = r.id
  LEFT JOIN department d
  ON d.id = r.department_id
  GROUP BY d.id, d.name`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const department = res.map(data => ({
      value: data.id, name: data.name
    }));

    console.table(res);
    console.log("Department must be chosen\n");

    promptDepartment(department);
  });

}

function promptDepartment(department) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "departmentId",
        message: "Which department do you want to see?",
        choices: department
      }
    ])
    .then(function (answer) {
      console.log("Chosen Department: ", answer.departmentId);

      var query =
        `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department 
  FROM employee e
  JOIN role r
	ON e.role_id = r.id
  JOIN department d
  ON d.id = r.department_id
  WHERE d.id = ?`

      connection.query(query, answer.departmentId, function (err, res) {
        if (err) throw err;

        console.table("response ", res);
        console.log(res.affectedRows + "Employees have been viewed by department\n");

        action();
      });
    });
}


/// Add an Employee

function addEmployee() {
  console.log("Adding a new employee")

  var query =
    `SELECT r.id, r.title, r.salary 
      FROM role r`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const roles = res.map(({ id, title, salary }) => ({
      value: id, title: `${title}`, salary: `${salary}`
    }));

    console.table(res);
    console.log("Role must be chosen");

    promptInsert(roles);
  });
}

function promptInsert(roles) {

  inquirer
    .prompt([
      {
        type: "input",
        name: "first_name",
        message: "What is the new employee's first name?"
      },
      {
        type: "input",
        name: "last_name",
        message: "What is the new employee's last name?"
      },
      {
        type: "list",
        name: "roleId",
        message: "What is the new employee's role?",
        choices: roles
      },
    ])
    .then(function (answer) {
      console.log(answer);

      var query = `INSERT INTO employee SET ?`
      connection.query(query,
        {
          first_name: answer.first_name,
          last_name: answer.last_name,
          role_id: answer.roleId,
          manager_id: answer.managerId,
        },
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log(res.insertedRows + "New employee has been added!\n");

          action();
        });
    });
}

/// Remove an Employee

function removeEmployee() {
  console.log("Deleting an employee");

  var query =
    `SELECT e.id, e.first_name, e.last_name
      FROM employee e`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const employeesDel = res.map(({ id, first_name, last_name }) => ({
      value: id, name: `${id} ${first_name} ${last_name}`
    }));

    console.table(res);
    console.log("Must choose an employee to delete\n");

    promptDelete(employeesDel);
  });
}

// User choose the employee list, then employee is deleted

function promptDelete(employeesDel) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee do you want to remove?",
        choices: employeesDel
      }
    ])
    .then(function (answer) {

      var query = `DELETE FROM employee WHERE ?`;
      // when finished prompting, insert a new item into the db with that info
      connection.query(query, { id: answer.employeeId }, function (err, res) {
        if (err) throw err;

        console.table(res);
        console.log(res.affectedRows + "has been deleted\n");

        action();
      });
    });
}

/// Update an Employee's Role

function updateRole() { 
  employeeArray();

}

function employeeArray() {
  console.log("Updating an employee's role");

  var query =
    `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
  FROM employee e
  JOIN role r
	ON e.role_id = r.id
  JOIN department d
  ON d.id = r.department_id
  JOIN employee m
	ON m.id = e.manager_id`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const employeeChoices = res.map(({ id, first_name, last_name }) => ({
      value: id, name: `${first_name} ${last_name}`      
    }));

    console.table(res);
    console.log("employeeArray to be update!\n")

    roleArray(employeeChoices);
  });
}

function roleArray(employeeChoices) {
  console.log("Updating a role for chosen employee");

  var query =
    `SELECT r.id, r.title, r.salary 
  FROM role r`
  let roles;

  connection.query(query, function (err, res) {
    if (err) throw err;

    roles = res.map(({ id, title, salary }) => ({
      value: id, title: `${title}`, salary: `${salary}`      
    }));

    console.table(res);
    console.log("roleArray to be updates!\n")

    promptRoles(employeeChoices, roles);
  });
}

function promptRoles(employeeChoices, roles) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee's role should be changed?",
        choices: employeeChoices
      },
      {
        type: "list",
        name: "roleId",
        message: "Which role should be updated?",
        choices: roles
      },
    ])
    .then(function (answer) {

      var query = `UPDATE employee SET role_id = ? WHERE id = ?`
      connection.query(query,
        [ answer.roleId,  
          answer.employeeId
        ],
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log(res.affectedRows + " has been updated");

          action();
        });
    });
}



///Add a Role

function addRole() {

  var query =
    `SELECT d.id, d.name, r.salary AS budget
    FROM employee e
    JOIN role r
    ON e.role_id = r.id
    JOIN department d
    ON d.id = r.department_id
    GROUP BY d.id, d.name`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const department = res.map(({ id, name }) => ({
      value: id, name: `${id} ${name}`
    }));

    console.table(res);
    console.log("");

    promptAddRole(department);
  });
}

function promptAddRole(department) {

  inquirer
    .prompt([
      {
        type: "input",
        name: "roleTitle",
        message: "Input Role Title"
      },
      {
        type: "input",
        name: "roleSalary",
        message: "Input Role Salary"
      },
      {
        type: "list",
        name: "departmentId",
        message: "Input Department",
        choices: department
      },
    ])
    .then(function (answer) {

      var query = `INSERT INTO role SET ?`

      connection.query(query, {
        title: answer.title,
        salary: answer.salary,
        department_id: answer.departmentId
      },
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log("Role has been created");

          action();
        });

    });
}

