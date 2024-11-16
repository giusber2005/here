
document.addEventListener('DOMContentLoaded', function() {
    
    let prefix = document.getElementById("prefixDiv");
    
    // Check if the element exists before accessing its properties
    if (prefix) {
        if (prefix.innerHTML === "None" || prefix.innerHTML === "null") {
            prefix.style.display = "none"; // Use "none" in lowercase
        }
    } else {
        console.error('Element with ID "prefixDiv" not found.');
    }

    var photoFileName = document.getElementById('PhotoFile').textContent.trim();
    var imagePath = 'static/profile_images/' + photoFileName;
    document.getElementById('PhotoPreview').src = imagePath;
    var deleteForm= document.getElementById("deleteForm");
    deleteForm.style.display = "block";


    photo = document.getElementById("PhotoPreview");
    if (photo.src.includes("None")) {
        photo.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
        photo.style.display = "none";

        button = document.getElementById("photoButton");
        deleteForm.style.display = "none";
        button.style.display = "none";
    };

    // Select the container by its ID
    let container = document.getElementById('optionalContainer');

    // Select all input elements inside the container
    let cards = container.querySelectorAll('.optionalCards');

    cards.forEach(card => {

        value = card.querySelector(".optionalValues");

        console.log(value);

        // Check if the input's value is "None"
        if (value === null || value.innerHTML === "None") {
            // Traverse up the DOM to find the closest form that contains this input
            let form = card.querySelector('form');
            
            // Now, select the button inside this form
            let button = form.querySelector('button');

            // Hide the button
            button.style.display = "none"; 
        }
    });
});
