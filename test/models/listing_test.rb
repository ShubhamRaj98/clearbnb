# == Schema Information
#
# Table name: listings
#
#  id            :bigint           not null, primary key
#  host_id       :bigint           not null
#  title         :string(255)      not null
#  about         :text(65535)
#  max_guests    :integer          default(1)
#  address_line1 :string(255)
#  city          :string(255)
#  state         :string(255)
#  postal_code   :string(255)
#  country       :string(255)
#  lat           :decimal(10, 6)
#  lng           :decimal(10, 6)
#  status        :integer          default(0)
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
require "test_helper"

class ListingTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
