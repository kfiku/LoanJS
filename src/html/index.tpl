<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= trans.page_title %></title>
</head>
<body>
  <header class="page-header">
    <h1 class="page-header__title"><%= trans.page_title %></h1>
    <p class="page-header__desc"><%= trans.page_description %></p>
  </header>

  <table>
    <thead>
      <tr>
        <th rowspan="2">#</th>
        <th rowspan="2"><%= trans.credit_amount %></th>
        <th rowspan="2"><%= trans.installments_quantity %></th>
        <th rowspan="2"><%= trans.interest %></th>
        <th colspan="2" class="text-center"><%= trans.equal_installments %></th>
        <th colspan="3" class="text-center"><%= trans.diminishing_installments %></th>
      </tr>
      <tr>
        <th><%= trans.interest_sum %></th>
        <th><%= trans.installment_amount %></th>
        <th><%= trans.interest_sum %></th>
        <th><%= trans.first_installment_amount %></th>
        <th><%= trans.last_installment_amount %></th>
      </tr>
    </thead>
    <tbody id="mainTbody">

    </tbody>
  </table>


  <script src="<%= assetsBase %>js/main.js"></script>
  <% if (env === 'dev') { %>
    <script>console.log('::LIVERELOAD::');</script>
    <script src="//localhost:9091"></script>
  <% } %>
</body>
</html>
