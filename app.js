//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});

const itemSchema = {
  name: String
};
const Item = mongoose.model("Item",itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist."
})

const item2 = new Item({
  name: "Hit the + button to aff a new item"
})

const item3 = new Item({
  name: "<-- Hit this to delete an item."
})

const defaultItems = [item1,item2,item3];


const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List",listSchema);



app.get("/", function(req, res) {
  Item.find({})
    .then(function(foundItems) {
      if(foundItems.length === 0){
        Item.insertMany(defaultItems);
        res.redirect("/");
      }
      else{
      res.render("list", { listTitle: "Today", newListItems: foundItems });
}})
    .catch(function(err) {
      console.error(err);
      // Handle the error here
    });
});

app.get("/:customListName",async (req,res)=>{
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });
  
    if (!foundList) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/"+customListName);
    } else {
      // Show an existing list
      res.render("list", { listTitle: customListName, newListItems: foundList.items });
    }
  } catch (err) {
    // Handle any errors that occur during the database operation
    console.error(err);
  }
  
  
  
});

app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred.");
    }
  }
});


app.post("/delete", async function (req, res) {
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    
    if(listName === "Today"){
      await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    }
    else{
      await List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}});
      res.redirect("/"+listName);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error removing item from the database.");
  }
});




app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
