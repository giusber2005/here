
document.addEventListener('DOMContentLoaded', function() {
    
    let prefix = document.getElementById("prefixDiv");
    if (prefix.innerHTML === "None") {
        prefix.style.display = "None";
    }

    var photoFileName = document.getElementById('PhotoFile').textContent.trim();
    var imagePath = 'static/profile_images/' + photoFileName;
    document.getElementById('PhotoPreview').src = imagePath;


    photo = document.getElementById("PhotoPreview");
    if (photo.src.includes("None")) {
        photo.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

        button = document.getElementById("photoButton");
        button.style.display = "None";
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
