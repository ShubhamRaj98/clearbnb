require "test_helper"

class Host::ListingsControllerTest < ActionDispatch::IntegrationTest
  test "should get new" do
    get host_listings_new_url
    assert_response :success
  end

  test "should get edit" do
    get host_listings_edit_url
    assert_response :success
  end

  test "should get index" do
    get host_listings_index_url
    assert_response :success
  end

  test "should get show" do
    get host_listings_show_url
    assert_response :success
  end
end
