let skip = 0;

window.onload = generateTodos;


function generateTodos()
{
    axios
    .get(`/read-item?skip=${skip}`)
    .then((res) => {
        if(res.data.status !== 200)
        {
            alert(res.data.message);
            return;
        }
        
        const todos = res.data.data;
        skip += todos.length;
        
         
         document.getElementById("item_list").insertAdjacentHTML(
            "beforebegin", 
            todos.map((item) => {
                 return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
         <span class="item-text"> ${item.todo}</span>
         <div>
         <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
         <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
         </div></li>`;}).join("")
         )
})
    .catch(error)
    
}

document.addEventListener("click", function (event) {

    // Edit

     if(event.target.classList.contains("edit-me")){
        const newData = prompt("Enter New Todo Text");
        const todoId = event.target.getAttribute("data-id");

        axios
        .post('/edit-item',{ newData, todoId })
        .then((res) => {
            if(res.data.status !== 200){
                alert(res.data.message)
                return;
            }
            event.target.parentElement.parentElement
            .querySelector(".item-text")
            .innerHTML = newData
        })
        .catch(error);
     }

     // Delete

     else if (event.target.classList.contains("delete-me")){
        const todoId = event.target.getAttribute("data-id");

        axios
        .post("/delete-item", {todoId})
        .then((res) => {
            if(res.data.status !== 200)
            {
                alert(res.data.message)
                return;
            }
            event.target.parentElement.parentElement
            .remove();
        })
        .catch((error)) ;
     }

     // Create
    
     else if(event.target.classList.contains("add_item")){
       const todo = document.getElementById("create_field").value 

       axios
       .post("/create-item", { todo })
       .then((res) => {
            document.getElementById("create_field").value = "";
            const todo = res.data.data.todo;
            const todoId = res.data.data._id;

            document.getElementById("item_list").insertAdjacentHTML(
                "beforeend", 
               
            `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
             <span class="item-text"> ${todo}</span>
             <div>
             <button data-id="${todoId}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
             <button data-id="${todoId}" class="delete-me btn btn-danger btn-sm">Delete</button>
             </div></li>` ).join("")

     })
       .catch((error) => {
            if(error.response.status !== 500)
           {
            alert(error.response.data);
           }
        });
     } 

     // Shoe More

     else if (event.target.classList.contains("show_more")) {
        generateTodos();
      }
    
     
});