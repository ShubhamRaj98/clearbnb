class Users::OmniauthCallbacksController < ApplicationController
 include Devise::Controllers::Helpers
	def google
		@user = User.from_omniauth(request.env["omniauth.auth"])
			if @user.persisted?
			      sign_in_and_redirect @user, event: :authentication #this will throw if @user is not activated
			      set_flash_message(:notice, :success, kind: "Google") if is_navigational_format?
			    else
			      session["devise.google_data"] = request.env["omniauth.auth"].except(:extra) # Removing extra as it can overflow some session stores
			      redirect_to new_user_registration_url
			end
	 end


		def failure
		    redirect_to root_path
		end
		

end
