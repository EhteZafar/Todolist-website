//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/todolistDB');
  //mongodb+srv://Ehtesham:<password>@cluster0.y8vex1o.mongodb.net/?retryWrites=true&w=majority
  console.log(" Connection successful.");
  }

const itemsSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const defaultitems = [item1];
const day = date.getDate();
app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems) {
    if(err) {
      console.log(err);
    } else {
      if(foundItems.length === 0) {
        Item.insertMany(defaultitems, function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("Items added to DB.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
    }
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        const list = new List({
          name: customListName,
          items: defaultitems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName == day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkItemId = req.body.checkbox;
  const listTitle = req.body.listName;

  if(listTitle === day) {
    Item.findByIdAndRemove(checkItemId, function(err) {
      if(!err) {
        console.log("successfully deleted item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkItemId}}}, function(err, foundList) {
      if(!err) {
        res.redirect("/" + listTitle);
      }
    });
  }
});

app.listen(process.env.PORT || 4000, function() {
    console.log("Server started on port 4000");
});
