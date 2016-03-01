<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= trans.page_title %></title>
  <link href="dist/c3.css" rel="stylesheet" type="text/css">
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
        <th colspan="3" class="text-center"><%= trans.equal_installments %></th>
        <th colspan="4" class="text-center"><%= trans.diminishing_installments %></th>
        <th rowspan="2"></th>
      </tr>
      <tr>
        <th><%= trans.interest_sum %></th>
        <th><%= trans.installment_amount %></th>
        <th></th>
        <th><%= trans.interest_sum %></th>
        <th><%= trans.first_installment_amount %></th>
        <th><%= trans.last_installment_amount %></th>
        <th></th>
      </tr>
    </thead>
    <tbody id="mainTbody">

    </tbody>
  </table>

  <button id="addCompareRow"><%= trans.add_new_row %></button>

  <div id="chart"></div>

  <script>
    var trans = <%= JSON.stringify(trans) %>
  </script>
  <script src="<%= assetsBase %>js/main.js"></script>
  <% if (env === 'dev') { %>
    <script>console.log('::LIVERELOAD::');</script>
    <script src="//localhost:9091"></script>
  <% } %>
</body>
</html>
