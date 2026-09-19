class Animal
  # Readable attributes are exposed intentionally via attr_reader, keeping the
  # writable surface explicit — no mass-assignment-style open attributes.
  attr_reader :name

  def initialize(name)
    @name = name
  end

  def speak
    "..."
  end
end

class Dog < Animal
  def speak
    "Woof!"
  end
end

rex = Dog.new("Rex")
puts "#{rex.name} says #{rex.speak}"
