document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.querySelector('#userTable tbody');
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('searchBtn');
    const selectAllCheckbox = document.getElementById('selectAll');
    const deleteBtn = document.getElementById('deleteBtn');
    const paginationContainer = document.querySelector('.pagination');
  
    let userData = []; 
  
    const itemsPerPage = 5;
    let currentPage = 1;
    let totalPages = 0;
  
    // 
    async function fetchData() {
      try {
        const response = await fetch('https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json');
        const data = await response.json();
        userData = data;
        renderTable(); 
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  
    // Initial fetch of data
    fetchData();
  
    searchBtn.addEventListener('click', () => {
      currentPage = 1;
      renderTable();
    });
  

  
    // Updated renderTable function with pagination and fetching data
    async function renderTable() {
      const searchTerm = searchInput.value.toLowerCase();
      const filteredData = userData.filter(user =>
        Object.values(user).some(value => value.toString().toLowerCase().includes(searchTerm))
      );
  
      const totalItems = filteredData.length;
      totalPages = Math.ceil(totalItems / itemsPerPage);
  
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageData = filteredData.slice(startIndex, endIndex);
  
      tableBody.innerHTML = '';
  
      if (pageData.length === 0 && totalPages > 0) {
        currentPage = Math.max(1, currentPage - 1);
        renderTable();
        return;
      }
      selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.rowCheckbox');
        checkboxes.forEach(checkbox => {
          checkbox.checked = selectAllCheckbox.checked;
        });
      });
      
      deleteBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.rowCheckbox:checked');
        checkboxes.forEach(checkbox => {
          const row = checkbox.closest('tr');
          deleteRow(row.dataset.id);
        });
      
        selectAllCheckbox.checked = false;
      });
      
  
      pageData.forEach(user => {
        const row = document.createElement('tr');
        row.dataset.id = user.id;
        row.innerHTML = `
          <td><input type="checkbox" class="rowCheckbox"></td>
          <td>${user.id}</td>
          <td class="editable" data-field="name">${user.name}</td>
          <td class="editable" data-field="email">${user.email}</td>
          <td class="editable" data-field="role">${user.role}</td>
          <td>
            <button class="editBtn" onclick="editRow('${user.id}')">Edit</button>
            <button class="deleteBtn" onclick="deleteRow('${user.id}')">Delete</button>
          </td>
        `;
  
        tableBody.appendChild(row);
      });
  
      updatePagination(totalPages);
    }
      
      function updatePagination(totalPages) {
        paginationContainer.innerHTML = '';
      
        if (totalPages > 1) {
          const firstPageBtn = createPaginationButton('first-page', 'First', () => goToPage(1));
          paginationContainer.appendChild(firstPageBtn);
      
          const prevPageBtn = createPaginationButton('previous-page', 'Previous', () => goToPage(currentPage - 1));
          paginationContainer.appendChild(prevPageBtn);
      
          for (let i = 1; i <= totalPages; i++) {
            const pageBtn = createPaginationButton(`page-${i}`, i, () => goToPage(i));
            paginationContainer.appendChild(pageBtn);
          }
      
          const nextPageBtn = createPaginationButton('next-page', 'Next', () => goToPage(currentPage + 1));
          paginationContainer.appendChild(nextPageBtn);
      
          const lastPageBtn = createPaginationButton('last-page', 'Last', () => goToPage(totalPages));
          paginationContainer.appendChild(lastPageBtn);
      
          updatePaginationButtonsState();
        }
      }
      
  
    function createPaginationButton(className, text, onClick) {
      const button = document.createElement('button');
      button.classList.add(className);
      button.textContent = text;
      button.addEventListener('click', onClick);
      return button;
    }
  
    function goToPage(page) {
        currentPage = Math.max(1, Math.min(page, totalPages));
        renderTable();
      }
      
  
    function updatePaginationButtonsState() {
      document.querySelectorAll('.pagination button').forEach(button => {
        button.disabled = false;
      });
  
      if (currentPage === 1) {
        document.querySelector('.first-page').disabled = true;
        document.querySelector('.previous-page').disabled = true;
      }
  
      if (currentPage === totalPages) {
        document.querySelector('.last-page').disabled = true;
        document.querySelector('.next-page').disabled = true;
      }
    }
  
    window.deleteRow = function (userId) {
      userData = userData.filter(user => user.id !== userId);
      renderTable();
    };
  
    window.editRow = function (userId) {
      const row = tableBody.querySelector(`tr[data-id="${userId}"]`);
      if (row) {
        const isEditable = row.classList.contains('editable-row');
  
        if (isEditable) {
          // Save or cancel edit
          saveOrCancelEdit(row, userId);
        } else {
          // Make only this row editable
          disableEditingForAllRows();
          enableEditingForRow(row);
  
          const editBtn = row.querySelector('.editBtn');
          const deleteBtn = row.querySelector('.deleteBtn');
          const saveBtn = document.createElement('button');
          saveBtn.classList.add('saveBtn');
          saveBtn.textContent = 'Save';
          saveBtn.addEventListener('click', () => saveOrCancelEdit(row, userId));
  
          const cancelBtn = document.createElement('button');
          cancelBtn.classList.add('cancelBtn');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.addEventListener('click', () => saveOrCancelEdit(row, userId));
  
          row.replaceChild(saveBtn, editBtn);
          row.replaceChild(cancelBtn, deleteBtn);
        }
      }
    };
  
    function disableEditingForAllRows() {
      document.querySelectorAll('.editable-row').forEach(row => {
        row.classList.remove('editable-row');
        row.querySelectorAll('.editing').forEach(cell => {
          cell.innerHTML = cell.querySelector('input').value;
          cell.classList.remove('editing');
        });
      });
    }
  
    function enableEditingForRow(row) {
      row.classList.add('editable-row');
      row.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('click', startEditing);
      });
    }
  
    function saveOrCancelEdit(row, userId) {
      disableEditingForAllRows();
  
      const editBtn = document.createElement('button');
      editBtn.classList.add('editBtn');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editRow(userId));
  
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('deleteBtn');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteRow(userId));
  
      row.replaceChild(editBtn, row.querySelector('.saveBtn'));
      row.replaceChild(deleteBtn, row.querySelector('.cancelBtn'));
  
      renderTable();
    }
  
    function startEditing(event) {
      const cell = event.target;
      if (!cell.classList.contains('editing')) {
        const input = document.createElement('input');
        const oldValue = cell.textContent;
        input.value = oldValue;
        input.addEventListener('blur', () => finishEditing(cell, input, oldValue));
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            input.blur();
          } else if (e.key === 'Escape') {
            input.value = oldValue;
            input.blur();
          }
        });
        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
        cell.classList.add('editing');
      }
    }
  
    function finishEditing(cell, input, oldValue) {
      const newValue = input.value;
      const field = cell.dataset.field;
  
      const rowId = cell.closest('tr').dataset.id;
      const userIndex = userData.findIndex(user => user.id === rowId);
  
      if (userIndex !== -1) {
        userData[userIndex][field] = newValue;
      }
  
      renderTable();
    }
  });
  