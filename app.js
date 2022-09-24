//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose =require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

/*                          MONGO DATABASE WORK                                */

main().catch(err => console.log(err));
async function main()
{
  await mongoose.connect("mongodb+srv://test:test123@atlascluster.yh8f2.mongodb.net/todolistDB", {useNewUrlParser: true});
}
const {Schema} = mongoose;
 /*                    ITEM SCHEMA OF MAIN LIST                       */
const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const Item1 = new Item({
  name:"Welcome to your todolist!"
});
const Item2 = new Item({
  name:"Hit the + button to add a new item."
});
const Item3 = new Item({
  name:"<-- Hit this to delete an item."
});

const defaultItems = [Item1, Item2, Item3];
/*                 END OF ITEM SCHEMA OF MAIN LIST                       */

/*                 LIST SCHEMA OF CUSTOM LIST                     */
const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);
/*              END OF LIST SCHEMA OF CUSTOM LIST                     */

/*                      END OF MONGODB WORK                          */



//                   MAIN LIST EXPRESS ROUTES
app.get("/", function(req, res) {

  Item.find({}, function(error, foundItems)
{
  if(foundItems.length === 0)
  {
    Item.insertMany(defaultItems, function(err)
    {
      if(err) console.log(err);
      else console.log("Default items were successfull added to our database.");
    });
    res.redirect("/");
  }
  else{
   console.log(foundItems);
   res.render("list", {listTitle: "Today", newListItems: foundItems});
 }
});


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItemDocument = new Item({
    name: itemName
  });

  if(listName === "Today")
  {
    newItemDocument.save(function(err)
  {
    if(err) return handleError(err);
    else console.log("Your new item is successfully saved in our db.");
  });
  res.redirect("/");
  }

  else {
    List.findOne({name:listName}, function(error, foundList)
    {
      foundList.items.push(newItemDocument);
      foundList.save(function(err){if(err) return handleError(err); else console.log("Item saved into new custom list successfully.");});
      res.redirect("/"+listName);
    });
  }

});

app.post("/delete", function(req,res)
{
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today")
  {
    Item.findByIdAndRemove(checkedItemID, function(err)
    {
      if(err){console.log(err);}
       else{console.log("Successfully Removed from listSchema."); res.redirect("/");}
    });
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull:{items:{_id: checkedItemID}}},function(err,foundList){if(!err){res.redirect("/"+listName);} });
  }

});

//                 END OF MAIN LIST EXPRESS ROUTES

//                 CUSTOM LIST EXPRESS ROUTES
app.get("/:customListName", function(req,res)
{
  const requestedListName =_.capitalize(req.params.customListName);
  console.log(requestedListName);
  List.findOne({name:requestedListName}, function(error, foundList)
{
  if(!error)
  {
    if(!foundList)
    {
      const newCustomList = new List({
        name: requestedListName,
        items: defaultItems
      });
      newCustomList.save(function(err){if(err) return handleError(err); else console.log("New custom list successfully created.");});
      res.redirect("/"+ requestedListName);
    }
    else {
      console.log(foundList);// consoles log pre existing document and renders it on list.ejs
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    }

  }
});
});
//                 END OF CUSTOM LIST EXPRESS ROUTES



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
