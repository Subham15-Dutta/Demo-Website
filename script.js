document.getElementById('actionBtn').addEventListener('click', () => {
  alert('Button clicked — test successful!');
});

document.getElementById('contactForm').addEventListener('submit', function(e){
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const msg = document.getElementById('msg').value.trim();
  const result = document.getElementById('formResult');

  if(!name || !email){
    result.textContent = 'Name and Email are required.';
    result.style.color = 'crimson';
    return;
  }

  result.style.color = 'green';
  result.textContent = `Thank you ${name}, your message has been received. (Email: ${email})`;
  this.reset();
});