const expect = require('expect');
const request = require('supertest');
const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {ObjectID} = require('mongodb');

const todos = [{
  _id: new ObjectID(),
  text: 'first test todo'
}, {
  _id: new ObjectID(),
  text: 'second test todo',
  completed: true,
  completedAt: 333
}];

beforeEach((done) => {
  Todo.remove({}).then(() =>{
    return Todo.insertMany(todos);
  }).then(() => done());
});

describe('PST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'test todo text';

    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create todo with invalid data', (done) => {
    var text = '    ';

    request(app)
      .post('/todos')
      .send({text})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /todos', () => {
  it('should get all the todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /tods/:id', () => {
  it('should get the correct todo', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text)
      })
      .end(done);
  });
  it('should get no todo for invaid id', (done) => {
    request(app)
      .get('/todos/1234')
      .expect(404)
      .end(done);
  });
  it('should get no todo for actual not-found', (done) => {
    var fake = new ObjectID().toHexString();
    request(app)
      .get(`/todos/${fake}`)
      .expect(404)
      .end(done);
  });

});


describe('DELETE /todos/:id', () => {
  it('should remove the correct todo', (done) => {
    request(app)
      .delete(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text)
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        Todo.findById(`${todos[0]._id.toHexString()}`)
          .then((todo) => {
            expect(todo).toNotExist();
          })
          .catch((e) => done(e))
      });

      request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(404)
      .end(done);
  });
  it('should 404 for invaid id', (done) => {
    request(app)
      .delete('/todos/1234')
      .expect(404)
      .end(done);
  });
  it('should get 404 for actual not-found', (done) => {
    var fake = new ObjectID().toHexString();
    request(app)
      .delete(`/todos/${fake}`)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    var firstId = todos[0]._id.toHexString();
    var body = {
      text: "something new",
      completed: true
    };
    request(app)
      .patch(`/todos/${firstId}`)
      .send(body)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(body.text);
        expect(res.body.todo.completed).toBe(body.completed);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end(done);
  });
  it('should update the todo 2', (done) => {
    var firstId = todos[1]._id.toHexString();
    var body = {
      text: "something new",
      completed: false
    };
    request(app)
      .patch(`/todos/${firstId}`)
      .send(body)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(body.text);
        expect(res.body.todo.completed).toBe(body.completed);
        expect(res.body.todo.completedAt).toNotExist();
      })
      .end(done);
  });
});
