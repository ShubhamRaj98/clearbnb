Rails.application.routes.draw do
  namespace :host do
    resources :listings
  end
  devise_for :users, controllers: { omniauth_callbacks: 'users/omniauth_callbacks' } 
  root to: 'static_pages#home'
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end
